# Instagram Reel Comment Automation 🚀

A highly-isolated, production-ready Node.js Express server that replies to Instagram comments with customized DMs and links based specifically on the **Reel ID**.

## 🌐 Endpoints
- **GET** `/health` - Returns 200 OK to check server status.
- **GET** `/webhook` - Used by Meta to verify your endpoint.
- **POST** `/webhook` - Used by Meta to push live Instagram comment events.

## 🛠️ Environment Variables
Required variables for `.env`:
```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=TEST
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
MONGODB_URI=mongodb://127.0.0.1:27017/instagram_automation
META_WEBHOOK_VERIFY_TOKEN=your_random_verify_token_string
PORT=3000
```
> **Security:** Never expose `META_ACCESS_TOKEN` or `META_APP_SECRET` in logs, frontend code, or git repositories.

## 🔗 Meta Webhook Configuration Steps

1. Go to your [Meta App Dashboard](https://developers.facebook.com/).
2. Navigate to **Webhooks** (or set up webhooks under Instagram Graph API).
3. Select **Instagram** from the dropdown.
4. Click **Subscribe to this object**.
5. **Callback URL:** Enter your secure HTTPS endpoint. Example: `https://your-ngrok-url.com/webhook`
6. **Verify Token:** Enter the exact string you saved as `META_WEBHOOK_VERIFY_TOKEN` in your `.env`.
7. Click **Verify and Save**. (Your Node server must be running so it can respond to Meta's GET request).
8. Once verified, find the **`comments`** field in the Webhook fields list and click **Subscribe**.

## 🧪 Local Testing Instructions

### 1. Test the Verification Endpoint Safely
Run the server locally:
```bash
node instagramAutomation.js
```
Open a new terminal and send a fake Meta verification request to simulate the dashboard setup:
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=your_random_verify_token_string&hub.challenge=CHALLENGE_ACCEPTED"
```
*Expected Output:* `CHALLENGE_ACCEPTED` (and `✅ Webhook Verified by Meta` in server logs).

### 2. Test Comment Events (Safe Simulation Mode)
While `META_ACCESS_TOKEN` is set to `TEST` in your `.env`, **no real DMs will be sent**. The server will simply parse the webhook, match the Reel ID to the campaign, enforce duplicate protection, and log what *would* have happened.

Simulate a webhook POST:
```bash
curl -X POST http://localhost:3000/webhook \
-H "Content-Type: application/json" \
-d '{
  "object": "instagram",
  "entry": [
    {
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "comment_123",
            "text": "🔥",
            "from": { "id": "user_456" },
            "media": { "id": "111" }
          }
        }
      ]
    }
  ]
}'
```
Check your server logs. It should say:
`[TEST MODE] 📤 Simulated DM payload for Comment ID: comment_123`

### 3. Go Live
When you are ready to send real DMs, change `META_ACCESS_TOKEN` in your `.env` to your real Page Access Token, and restart the server.
