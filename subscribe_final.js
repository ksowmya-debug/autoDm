require('dotenv').config();
const pageToken = "EAAqYHjki9BMBSuxi1Sg7G2QDiERs5ptZBmNB9cxWbCh0VGGZAG2NJUQeTy8ZAkcVBDhAS7yZAdAZCeQtjh9X3ASTYPMXqr5DLHSSUsMUXoKzxJ0MVxMklp8hliSzDZCdxkhMYC5quShEytFZA3ltTrvmIjbwOMr5TQ2Modbq1jU7SJLCm6OADnzjCkCePrjZCPb5CeUChi6V";
fetch(`https://graph.facebook.com/v26.0/1324391767430278/subscribed_apps?subscribed_fields=messages,feed,mention&access_token=${pageToken}`, { method: 'POST' })
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data)));
