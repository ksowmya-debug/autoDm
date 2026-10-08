require('dotenv').config();
fetch('https://graph.facebook.com/v26.0/18143681323597481/replies', { 
    method: 'POST', 
    headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + process.env.PAGE_ACCESS_TOKEN 
    }, 
    body: JSON.stringify({ message: 'Testing reply API' }) 
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data)));
