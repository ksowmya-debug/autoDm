const fs = require('fs');

let content = fs.readFileSync('instagramAutomation.js', 'utf8');

const pollingLogic = `

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
            const res = await fetch(\`https://graph.facebook.com/v26.0/\${campaign.reelId}/comments?access_token=\${token}\`);
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
                        const cRes = await fetch(\`https://graph.facebook.com/v26.0/\${fbComment.id}?fields=from&access_token=\${token}\`);
                        const cData = await cRes.json();
                        if (cData.from && cData.from.id) mappedComment.userId = cData.from.id;
                    }

                    // If it's the admin, skip. (Commented out for testing)
                    // if (mappedComment.userId === process.env.INSTAGRAM_ACCOUNT_ID) continue;

                    if (mappedComment.userId !== 'UNKNOWN') {
                        console.log("\\n[POLLING] Found new comment! Triggering bot...");
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
`;

if (!content.includes('POLLING FALLBACK SYSTEM')) {
    content = content.replace('async function startServer() {', pollingLogic + '\nasync function startServer() {');
    content = content.replace('app.listen(PORT, () => {', 'app.listen(PORT, () => {\n            setInterval(pollForComments, 10000);\n            console.log("🔄 Polling Fallback System activated (checking every 10s)");');
    fs.writeFileSync('instagramAutomation.js', content, 'utf8');
    console.log("Patched successfully!");
} else {
    console.log("Already patched.");
}
