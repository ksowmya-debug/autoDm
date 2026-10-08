require('dotenv').config();
const appId = process.env.META_APP_ID;
const redirectUri = process.env.META_OAUTH_REDIRECT_URI || 'https://automated-spherical-naming.ngrok-free.dev/auth/meta/callback';
const configId = process.env.META_CONFIG_ID || '1448523494153487';
console.log('URL:', `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code&override_default_response_type=true`);
