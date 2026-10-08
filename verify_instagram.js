require('dotenv').config();

async function checkInstagramConnection() {
    const token = process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.trim() : null;

    if (!token || token === 'TEST') {
        console.log("❌ Valid META_ACCESS_TOKEN not found in .env");
        return;
    }

    try {
        console.log("🔍 Checking Facebook Pages connected to this token...");
        const pagesRes = await fetch(`https://graph.facebook.com/v26.0/me/accounts?access_token=${token}`);
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            console.log("❌ Error fetching pages:", pagesData.error.message);
            return;
        }

        if (!pagesData.data || pagesData.data.length === 0) {
            console.log("❌ No Facebook Pages found for this token. Did you grant 'pages_show_list' permission?");
            return;
        }

        let foundInstagram = false;

        for (const page of pagesData.data) {
            const pageId = page.id;
            const pageName = page.name;
            
            // Check for connected Instagram account
            const igRes = await fetch(`https://graph.facebook.com/v26.0/${pageId}?fields=instagram_business_account&access_token=${token}`);
            const igData = await igRes.json();

            if (igData.instagram_business_account) {
                foundInstagram = true;
                const igId = igData.instagram_business_account.id;

                // Fetch Instagram details
                const detailRes = await fetch(`https://graph.facebook.com/v26.0/${igId}?fields=username,account_type&access_token=${token}`);
                const detailData = await detailRes.json();

                console.log(`\n✅ Found Instagram Account connected to Facebook Page: "${pageName}"`);
                console.log(`- Instagram Username: ${detailData.username}`);
                console.log(`- Numeric Account ID: ${igId}`);
                // Graph API might not return account_type directly on this node in v26.0, but we'll print what we get
                if (detailData.account_type) {
                    console.log(`- Account Type: ${detailData.account_type}`);
                } else {
                    console.log(`- Account Type: Creator/Professional (Implied by API access)`);
                }
            }
        }

        if (!foundInstagram) {
            console.log("\n❌ No Instagram Professional/Creator account was found linked to any of the Facebook Pages authorized by this token.");
            console.log("Make sure your Instagram account is explicitly converted to Professional and linked to a Facebook Page.");
        }

    } catch (err) {
        console.log("System error:", err);
    }
}

checkInstagramConnection();
