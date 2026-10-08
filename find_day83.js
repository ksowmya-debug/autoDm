require('dotenv').config();
async function findDay83() {
    const token = process.env.META_ACCESS_TOKEN.trim();
    const res = await fetch('https://graph.facebook.com/v26.0/17841426222641721/media?fields=id,caption,permalink,media_type&limit=5&access_token=' + token);
    const data = await res.json();
    if(data.data) {
        for(const item of data.data) {
            if(item.caption && (item.caption.toLowerCase().includes('day 83') || item.caption.toLowerCase().includes('day83') || item.caption.toLowerCase().includes('day-83'))) {
                console.log('FOUND DAY 83:', item.id);
                return;
            }
        }
    }
    console.log('Not found yet. Latest 3 reels are:');
    if(data.data) data.data.slice(0,3).forEach(i => console.log(i.id, i.caption ? i.caption.substring(0, 20) : ''));
}
findDay83();
