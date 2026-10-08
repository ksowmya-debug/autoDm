const fs = require('fs');
let code = fs.readFileSync('instagramAutomation.js', 'utf8');

const target1 = "const url = `https://graph.facebook.com/${graphApiVersion}/me/messages`;";
const replacement1 = `const pageId = process.env.FACEBOOK_PAGE_ID;
            const pageToken = process.env.PAGE_ACCESS_TOKEN;
            const url = \`https://graph.facebook.com/\${graphApiVersion}/\${pageId}/messages\`;`;

const target2 = "'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`";
const replacement2 = "'Authorization': `Bearer ${pageToken}`";

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('instagramAutomation.js', code, 'utf8');
console.log('Fixed');
