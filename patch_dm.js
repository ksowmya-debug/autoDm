const fs = require('fs');

let content = fs.readFileSync('instagramAutomation.js', 'utf8');

const target = `    async sendDirectMessage(commentId, fullMessageText) {
        if (!process.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN === 'TEST') {
            console.log(\`  [SIMULATION] 📤 Simulated DM sent for Comment ID: \${commentId}\`);
            return;
        }

        try {
            // PRODUCTION MODE: Real Meta Graph API private reply call
            console.log(\`  [API] 📤 Sending Real DM via Graph API for Comment ID: \${commentId}\`);
            const graphApiVersion = 'v26.0';
            // Using "me/messages" endpoint which routes through the connected Page's token
            const url = \`https://graph.facebook.com/\${graphApiVersion}/me/messages\`;

            const payload = {
                recipient: { comment_id: commentId },
                message: { text: fullMessageText }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${process.env.META_ACCESS_TOKEN}\`
                },
                body: JSON.stringify(payload)
            });`;

const replacement = `    async sendDirectMessage(commentId, fullMessageText) {
        if (!process.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN === 'TEST') {
            console.log(\`  [SIMULATION] 📤 Simulated DM sent for Comment ID: \${commentId}\`);
            return;
        }

        try {
            // PRODUCTION MODE: Real Meta Graph API private reply call
            console.log(\`  [API] 📤 Sending Real DM via Graph API for Comment ID: \${commentId}\`);
            const graphApiVersion = 'v26.0';
            
            // For Instagram Private Replies, we MUST use the Page ID and Page Access Token
            const pageId = process.env.FACEBOOK_PAGE_ID;
            const pageToken = process.env.PAGE_ACCESS_TOKEN;
            
            const url = \`https://graph.facebook.com/\${graphApiVersion}/\${pageId}/messages\`;

            const payload = {
                recipient: { comment_id: commentId },
                message: { text: fullMessageText }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${pageToken}\`
                },
                body: JSON.stringify(payload)
            });`;

content = content.replace(target, replacement);
fs.writeFileSync('instagramAutomation.js', content, 'utf8');
console.log("Patched successfully!");
