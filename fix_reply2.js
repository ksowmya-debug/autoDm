const fs = require('fs');
let code = fs.readFileSync('instagramAutomation.js', 'utf8');

if (!code.includes('sendCommentReply')) {
    const target = 'await this.sendRealInstagramDM(comment.commentId, campaign.dmMessage, campaign.link);';
    const replacement = 'await this.sendRealInstagramDM(comment.commentId, campaign.dmMessage, campaign.link);\n\n            // 3.5 Send Public Comment Reply (if configured)\n            if (campaign.commentReply) {\n                await this.sendCommentReply(comment.commentId, campaign.commentReply);\n            }';
    code = code.replace(target, replacement);

    const targetFunc = 'async sendRealInstagramDM(commentId, dmMessage, link) {';
    const replacementFunc = `async sendCommentReply(commentId, replyText) {
        try {
            const pageToken = process.env.PAGE_ACCESS_TOKEN;
            const url = \`https://graph.facebook.com/v26.0/\${commentId}/replies\`;
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${pageToken}\`
                },
                body: JSON.stringify({ message: replyText })
            });
            console.log(\`  [API] 💬 Sent public comment reply: "\${replyText}"\`);
        } catch(err) { console.error("Comment reply error", err); }
    }

    async sendRealInstagramDM(commentId, dmMessage, link) {`;
    code = code.replace(targetFunc, replacementFunc);

    fs.writeFileSync('instagramAutomation.js', code, 'utf8');
    console.log('Fixed public reply completely!');
} else {
    console.log('Already had it!');
}
