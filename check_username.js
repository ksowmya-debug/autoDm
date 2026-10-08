require('dotenv').config();
const token = process.env.META_ACCESS_TOKEN.trim();
fetch(`https://graph.facebook.com/v26.0/17841426222641721?fields=username&access_token=${token}`)
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data)));
