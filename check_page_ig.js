require('dotenv').config();
const token = process.env.META_ACCESS_TOKEN.trim();
fetch(`https://graph.facebook.com/v26.0/1324391767430278?fields=instagram_business_account&access_token=${token}`)
    .then(r => r.json())
    .then(data => {
        console.log(JSON.stringify(data, null, 2));
    });
