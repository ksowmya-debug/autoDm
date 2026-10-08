require('dotenv').config();
const token = process.env.META_ACCESS_TOKEN.trim();
fetch(`https://graph.facebook.com/v26.0/me/permissions?access_token=${token}`)
    .then(r => r.json())
    .then(data => {
        console.log("Permissions granted:");
        console.log(JSON.stringify(data, null, 2));
    });
