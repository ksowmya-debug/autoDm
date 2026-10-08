require('dotenv').config();
async function findDay21() {
    const token = process.env.META_ACCESS_TOKEN.trim();
    let url = 'https://graph.facebook.com/v26.0/17841426222641721/media?fields=id,caption,permalink,media_type&limit=100&access_token=' + token;
    
    while(url) {
        const res = await fetch(url);
        const data = await res.json();
        if(!data.data) break;
        
        for(const item of data.data) {
            if(item.caption && (item.caption.toLowerCase().includes('day 21') || item.caption.toLowerCase().includes('day21') || item.caption.toLowerCase().includes('day-21'))) {
                console.log('FOUND DAY 21:', item.id, item.caption.substring(0, 50));
                return;
            }
        }
        url = data.paging && data.paging.next ? data.paging.next : null;
    }
    console.log('Day 21 not found in latest posts.');
}
findDay21();
