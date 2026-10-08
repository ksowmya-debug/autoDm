require('dotenv').config();
const token = process.env.META_ACCESS_TOKEN.trim();
fetch(`https://graph.facebook.com/v26.0/18392575285201561/comments?access_token=${token}`)
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data)));
