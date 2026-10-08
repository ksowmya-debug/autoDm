require('dotenv').config();
const pageToken = "EAAqYHjki9BMBSuxi1Sg7G2QDiERs5ptZBmNB9cxWbCh0VGGZAG2NJUQeTy8ZAkcVBDhAS7yZAdAZCeQtjh9X3ASTYPMXqr5DLHSSUsMUXoKzxJ0MVxMklp8hliSzDZCdxkhMYC5quShEytFZA3ltTrvmIjbwOMr5TQ2Modbq1jU7SJLCm6OADnzjCkCePrjZCPb5CeUChi6V";
const igUserId = "17841426222641721";
const commentId = "18284705527289193";

const payload = {
    recipient: { comment_id: commentId },
    message: { text: "Testing private reply!" }
};

fetch(`https://graph.facebook.com/v26.0/${igUserId}/messages?access_token=${pageToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data)));
