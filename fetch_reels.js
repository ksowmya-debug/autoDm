require('dotenv').config();

async function fetchReels() {
    const token = process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.trim() : null;
    const igUserId = "17841426222641721"; // sowmya.kcode

    if (!token || token === 'TEST') {
        console.log("❌ Valid META_ACCESS_TOKEN not found in .env");
        return;
    }

    try {
        console.log("🔍 Fetching Instagram Media for sowmya.kcode...\n");
        const res = await fetch(`https://graph.facebook.com/v26.0/${igUserId}/media?fields=id,caption,permalink,media_type&access_token=${token}`);
        const data = await res.json();

        if (data.error) {
            console.log("❌ Error fetching media:", data.error.message);
            return;
        }

        if (!data.data || data.data.length === 0) {
            console.log("No posts or reels found for this account.");
            return;
        }

        let reelCount = 0;
        for (const item of data.data) {
            // Include both VIDEO and REELS. (Graph API sometimes classifies reels as VIDEO).
            if (item.media_type === 'VIDEO' || item.media_type === 'REELS' || item.media_type === 'CAROUSEL_ALBUM') {
                reelCount++;
                const caption = item.caption ? item.caption.split('\n')[0].substring(0, 50) + '...' : 'No caption';
                console.log(`=============================================`);
                console.log(`📝 Caption: ${caption}`);
                console.log(`🆔 Reel ID: ${item.id}`);
                console.log(`🔗 URL:     ${item.permalink}`);
            }
        }

        if (reelCount === 0) {
            console.log("No video/reel posts found, but found other types of posts.");
            // Print all just in case
            for (const item of data.data) {
                const caption = item.caption ? item.caption.split('\n')[0].substring(0, 50) + '...' : 'No caption';
                console.log(`=============================================`);
                console.log(`📝 Caption: ${caption} (Type: ${item.media_type})`);
                console.log(`🆔 Media ID: ${item.id}`);
                console.log(`🔗 URL:     ${item.permalink}`);
            }
        }
        console.log(`=============================================\n`);
        console.log("✅ Done! Copy the 'Reel ID' of the post you want to automate and use it in your MongoDB database.");

    } catch (err) {
        console.log("System error:", err);
    }
}

fetchReels();
