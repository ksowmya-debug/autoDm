require('dotenv').config();
const token = process.env.META_ACCESS_TOKEN.trim();
fetch(`https://graph.facebook.com/v26.0/1324391767430278/subscribed_apps?subscribed_fields=messages,feed,mention&access_token=${token}`, { method: 'POST' })
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data)));
