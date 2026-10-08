const fs = require('fs');
let content = fs.readFileSync('instagramAutomation.js', 'utf8');

content = content.replace(/const url = \`https:\/\/graph\.facebook\.com\/\$\{graphApiVersion\}\/me\/messages\`;/g, 
\`const pageId = process.env.FACEBOOK_PAGE_ID;
        const pageToken = process.env.PAGE_ACCESS_TOKEN;
        const url = \\\`https://graph.facebook.com/\\\${graphApiVersion}/\\\${pageId}/messages\\\`;\`);

content = content.replace(/Authorization': \`Bearer \$\{process\.env\.META_ACCESS_TOKEN\}\`/g, 
"Authorization': `Bearer ${pageToken}`");

fs.writeFileSync('instagramAutomation.js', content, 'utf8');
console.log("Patched 100%");
