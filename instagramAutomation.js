/**
 * instagramAutomation.js
 * 
 * Production integration with Official Meta/Instagram Graph API and MongoDB.
 * Implements strict Reel ID isolation and "any_comment" duplicate protection.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// --- MongoDB Schemas ---

const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    reelId: { type: String, required: true, unique: true, index: true },
    reelUrl: { type: String },
    triggerMode: { type: String, enum: ['any_comment', 'keyword'], required: true },
    dmMessage: { type: String, required: true },
    link: { type: String, required: true },
    commentReply: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

const dmLogSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    reelId: { type: String, required: true, index: true },
    instagramUserId: { type: String, required: true },
    commentId: { type: String, required: true, unique: true, index: true },
    dmMessage: { type: String, required: true },
    linkSent: { type: String, required: true },
    status: { type: String, required: true, enum: ['SIMULATED', 'SENT', 'FAILED', 'DUPLICATE', 'REEL_CAMPAIGN_MISMATCH'] },
    error: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Compound unique index for Duplicate Protection (One DM per user per Reel)
dmLogSchema.index({ instagramUserId: 1, reelId: 1 }, { unique: true });

const DMLog = mongoose.model('DMLog', dmLogSchema);


// --- Core Automation Logic ---

class InstagramAutomation {
    async processComment(comment) {
        console.log(`\n--- 📥 Incoming Webhook Comment ---`);
        console.log(`Text: "${comment.text}" | User: ${comment.userId} | Reel: ${comment.reelId} | Comment ID: ${comment.commentId}`);
        
        // 1 & 2. Extract Reel ID and User ID
        if (!comment.reelId || !comment.userId) {
            console.log("  ❌ Ignored: Missing Reel ID or User ID.");
            return;
        }

        // 3. Find exact campaign by Reel ID
        const campaign = await Campaign.findOne({ reelId: comment.reelId }).exec();
        
        if (!campaign) {
            console.log(`  ❌ Ignored: No campaign found for Reel ID ${comment.reelId}.`);
            return;
        }

        // CRITICAL CHECK: Reel ID Mismatch Protection
        if (comment.reelId !== campaign.reelId) {
            console.log("  🚨 DO NOT SEND DM");
            console.log("  🚨 REEL_CAMPAIGN_MISMATCH");
            await this.logFailure(campaign._id, comment, campaign, 'REEL_CAMPAIGN_MISMATCH');
            return;
        }

        // 4. Verify campaign is active
        if (!campaign.active) {
            console.log(`  ❌ Ignored: Campaign ${campaign.name} is inactive.`);
            return;
        }

        // 5. Any comment = trigger
        if (campaign.triggerMode !== 'any_comment') {
            console.log(`  ❌ Ignored: Campaign ${campaign.name} is not in 'any_comment' mode.`);
            return;
        }
        
        // Duplicate protection check
        const isProcessed = await DMLog.findOne({ 
            instagramUserId: comment.userId, 
            reelId: comment.reelId, 
            status: 'SENT' 
        }).exec();

        if (isProcessed) {
            console.log(`  🛑 Ignored: User '${comment.userId}' has already been processed for Reel '${comment.reelId}'.`);
            await this.logFailure(campaign._id, comment, campaign, 'DUPLICATE');
            return;
        }

        // 6. Get link and message from THAT specific campaign
        const dmMessage = campaign.dmMessage;
        const link = campaign.link;
        const commentReply = campaign.commentReply;

        // 7. Send Real DM via Meta Graph API
        const dmResult = await this.sendRealInstagramDM(comment.commentId, dmMessage, link);

        // 8. Save result to MongoDB
        const logEntry = new DMLog({
            campaignId: campaign._id,
            reelId: comment.reelId,
            instagramUserId: comment.userId,
            commentId: comment.commentId,
            dmMessage: dmMessage,
            linkSent: link,
            status: dmResult.status,
            error: dmResult.error || null
        });
        
        try {
            await logEntry.save();
            console.log(`  ✅ Logged DM Exact Message and Link status: ${dmResult.status} for User: '${comment.userId}' on Reel: '${comment.reelId}'.`);
        } catch (error) {
            if (error.code === 11000) {
                console.error("  ⚠️ Duplicate log insertion attempted due to concurrent webhooks (caught by unique index)");
            } else {
                console.error("  ⚠️ Error saving log:", error);
            }
        }

        // 9. Send public comment reply if configured and DM was successful
        if (dmResult.status === 'SENT' && commentReply && commentReply.trim() !== '') {
            await this.sendPublicCommentReply(comment.commentId, commentReply);
        }
    }

    async logFailure(campaignId, comment, campaign, status, error = null) {
        try {
            const logEntry = new DMLog({
                campaignId: campaignId,
                reelId: comment.reelId,
                instagramUserId: comment.userId,
                commentId: comment.commentId,
                dmMessage: campaign.dmMessage,
                linkSent: campaign.link,
                status: status,
                error: error
            });
            await logEntry.save();
        } catch (e) {
            // Ignore duplicate insert errors for failures
        }
    }

    async sendRealInstagramDM(commentId, dmMessage, link) {
        // Construct the combined message and link as the final text payload
        const fullMessageText = `${dmMessage}\n\n${link}`;

        // TEST MODE: If META_ACCESS_TOKEN is not set or set to 'TEST', we simulate the request to prevent accidental spam during setup.
        if (!process.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN === 'TEST') {
            console.log(`  [TEST MODE] 📤 Simulated DM payload for Comment ID: ${commentId}`);
            console.log(`  [TEST MODE] 📝 Content:\n${fullMessageText}`);
            return { status: 'SIMULATED' };
        }

        // PRODUCTION MODE: Real Meta Graph API private reply call
        console.log(`  [API] 📤 Sending Real DM via Graph API for Comment ID: ${commentId}`);
        const graphApiVersion = 'v26.0';
        // Using "me/messages" endpoint which routes through the connected Page's token
        const pageId = process.env.FACEBOOK_PAGE_ID;
            const pageToken = process.env.PAGE_ACCESS_TOKEN;
            const url = `https://graph.facebook.com/${graphApiVersion}/${pageId}/messages`;

        const payload = {
            recipient: { comment_id: commentId },
            message: { text: fullMessageText }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pageToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                console.error(`  ❌ Meta API Error:`, JSON.stringify(data.error));
                return { status: 'FAILED', error: data.error };
            }

            return { status: 'SENT' };
        } catch (error) {
            console.error(`  ❌ Network/System Error:`, error.message);
            return { status: 'FAILED', error: error.message };
        }
    }

    async sendPublicCommentReply(commentId, replyMessage) {
        if (!process.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN === 'TEST') {
            console.log(`  [TEST MODE] 💬 Simulated public reply to ${commentId}: "${replyMessage}"`);
            return;
        }

        console.log(`  [API] 💬 Sending Real public reply to ${commentId}`);
        const graphApiVersion = 'v26.0';
        const url = `https://graph.facebook.com/${graphApiVersion}/${commentId}/replies`;

        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`
                },
                body: JSON.stringify({ message: replyMessage })
            });
        } catch (error) {
            console.error(`  ⚠️ Failed to send public reply:`, error.message);
        }
    }
}


// --- Express Webhook Server ---

const app = express();
app.use(express.json());

const automation = new InstagramAutomation();

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Instagram Automation Server is running' });
});

/**
 * Basic Privacy Policy for Meta Validation
 */
app.get('/privacy', (req, res) => {
    res.send(`
        <h1>Privacy Policy</h1>
        <p>This application automates Instagram responses. We only access data explicitly permitted by you via Meta's OAuth flow.</p>
        <p>Data stored (like Instagram User IDs) is used strictly for duplicate-comment protection and is never sold or shared.</p>
        <p>Contact: sowmya0410.k@gmail.com</p>
    `);
});

/**
 * Webhook Verification Endpoint
 * Meta requires this to confirm your server is valid when setting up the webhook.
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Webhook Verified by Meta');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * Webhook Event Endpoint
 * Receives the live comments from Instagram.
 */
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    console.log("\n[DEBUG] Raw Webhook Received:", JSON.stringify(body, null, 2));

    // Immediately respond 200 OK so Meta doesn't retry the payload
    res.status(200).send('EVENT_RECEIVED');

    if (body.object === 'instagram') {
        if (body.entry && body.entry.length > 0) {
            for (const entry of body.entry) {
                if (entry.changes && entry.changes.length > 0) {
                    for (const change of entry.changes) {
                        // Only process comment events
                        if (change.field === 'comments') {
                            const value = change.value;
                            
                            // TEMPORARILY DISABLED: Prevent infinite loops: ignore comments made by the bot account itself
                            // if (value.from.id === process.env.INSTAGRAM_ACCOUNT_ID) {
                            //    continue;
                            // }

                            const commentData = {
                                commentId: value.id,
                                text: value.text,
                                userId: value.from.id,
                                reelId: value.media.id
                            };

                            // Process the comment in the background
                            await automation.processComment(commentData);
                        }
                    }
                }
            }
        }
    }
});

/**
 * Initiate Facebook Login for Business
 * Redirects the user to the Meta OAuth dialog
 */
app.get('/auth/meta/login', (req, res) => {
    // Add .trim() to strip any hidden carriage returns or spaces from the .env file
    const appId = process.env.META_APP_ID ? process.env.META_APP_ID.trim() : null;
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI || 'https://automated-spherical-naming.ngrok-free.dev/auth/meta/callback';
    const configId = process.env.META_CONFIG_ID ? process.env.META_CONFIG_ID.trim() : '1448523494153487';

    if (!appId) {
        return res.status(500).json({ error: 'META_APP_ID is not configured in .env' });
    }

    // Using the unversioned endpoint to ensure maximum compatibility with config_id
    const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code&override_default_response_type=true`;
    
    console.log(`[OAuth] Redirecting user to Meta Authorization URL`);
    res.redirect(authUrl);
});

/**
 * OAuth Callback Endpoint
 * Facebook Login for Business flow
 */
app.get('/auth/meta/callback', async (req, res) => {
    const { code, error, error_description } = req.query;

    if (error) {
        console.error('❌ Meta OAuth Error:', error, error_description);
        return res.status(400).json({ status: 'ERROR', error, error_description });
    }

    if (!code) {
        return res.status(400).json({ status: 'ERROR', error: 'No authorization code provided' });
    }

    try {
        const redirectUri = process.env.META_OAUTH_REDIRECT_URI || 'https://automated-spherical-naming.ngrok-free.dev/auth/meta/callback';
        const appId = process.env.META_APP_ID ? process.env.META_APP_ID.trim() : '';
        const appSecret = process.env.META_APP_SECRET ? process.env.META_APP_SECRET.trim() : '';
        
        // Exchange code for access token
        const tokenUrl = `https://graph.facebook.com/v26.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
        
        const response = await fetch(tokenUrl);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Meta Token Exchange Error:', data.error);
            return res.status(400).json({ status: 'ERROR', error: data.error.message });
        }

        console.log('✅ Meta OAuth Token Exchange Successful!');
        console.log('\n======================================================');
        console.log('🔑 YOUR NEW META ACCESS TOKEN (Copy this into .env):');
        console.log(data.access_token);
        console.log('======================================================\n');
        
        // Note: You would securely store data.access_token into your DB for this user here.
        // E.g., updating a user model with the new token.

        res.status(200).json({ 
            status: 'SUCCESS', 
            message: 'Successfully authenticated with Meta. Check your Node.js terminal for the Access Token!',
        });

    } catch (err) {
        console.error('❌ Meta Callback System Error:', err);
        res.status(500).json({ status: 'ERROR', error: 'Internal server error during Meta callback' });
    }
});

// --- Bootstrapper ---



// --- POLLING FALLBACK SYSTEM ---
const processedComments = new Set();
const START_TIME = new Date().getTime();

async function pollForComments() {
    const token = process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.trim() : null;
    if (!token || token === 'TEST') return;

    try {
        const activeCampaigns = await Campaign.find({ active: true });
        if (activeCampaigns.length === 0) return;

        for (const campaign of activeCampaigns) {
            const res = await fetch(`https://graph.facebook.com/v26.0/${campaign.reelId}/comments?access_token=${token}`);
            const data = await res.json();
            
            if (data.data) {
                // Reverse to process oldest first (chronological)
                const comments = data.data.reverse();
                for (const fbComment of comments) {
                    if (processedComments.has(fbComment.id)) continue;
                    processedComments.add(fbComment.id);

                    const commentTime = new Date(fbComment.timestamp).getTime();
                    if (commentTime < START_TIME) continue;

                    const mappedComment = {
                        commentId: fbComment.id,
                        reelId: campaign.reelId,
                        userId: 'UNKNOWN',
                        text: fbComment.text
                    };
                    
                    if (fbComment.from && fbComment.from.id) {
                        mappedComment.userId = fbComment.from.id;
                    } else {
                        // Graph API sometimes omits 'from' on comments.
                        const cRes = await fetch(`https://graph.facebook.com/v26.0/${fbComment.id}?fields=from&access_token=${token}`);
                        const cData = await cRes.json();
                        if (cData.from && cData.from.id) mappedComment.userId = cData.from.id;
                    }

                    // If it's the admin, skip. (Commented out for testing)
                    // if (mappedComment.userId === process.env.INSTAGRAM_ACCOUNT_ID) continue;

                    if (mappedComment.userId !== 'UNKNOWN') {
                        console.log("\n[POLLING] Found new comment! Triggering bot...");
                        const bot = new InstagramAutomation();
                        bot.processComment(mappedComment);
                    }
                }
            }
        }
    } catch (err) {
        console.error("[Polling Error] Failed to fetch comments:", err.message);
    }
}

async function startServer() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/instagram_automation';
        await mongoose.connect(mongoUri);
        console.log(`✅ Connected to MongoDB at ${mongoUri}`);

        // Start Express Server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            setInterval(pollForComments, 10000);
            console.log("🔄 Polling Fallback System activated (checking every 10s)");
            console.log(`🚀 Webhook server is listening on port ${PORT}`);
            console.log(`Status Mode: ${process.env.META_ACCESS_TOKEN === 'TEST' || !process.env.META_ACCESS_TOKEN ? 'TEST (Simulated)' : 'PRODUCTION (Live Graph API)'}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = {
    Campaign,
    DMLog,
    InstagramAutomation,
    app
};
