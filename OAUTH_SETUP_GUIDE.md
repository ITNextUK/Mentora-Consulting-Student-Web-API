# OAuth 2.0 Setup Guide for Mentora Student Application

This guide will help you set up OAuth 2.0 authentication with Google, Facebook, and LinkedIn for the Mentora Student Application.

## Prerequisites

- Google Cloud Console account
- Facebook Developer account
- LinkedIn Developer account
- Access to your backend `.env` file

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
3. Name your project (e.g., "Mentora Student App")

### Step 2: Enable Google+ API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. Configure OAuth consent screen (if not already done):
   - User Type: **External**
   - App name: **Mentora Student Portal**
   - User support email: Your email
   - Developer contact information: Your email
   - Add scopes: `email`, `profile`
   - Add test users (optional for development)
   
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **Mentora Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3001` (development)
     - `https://mentora-consulting-student-web-api.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3001/api/v1/auth/google/callback` (development)
     - `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/google/callback` (production)

5. Click **Create**
6. Copy **Client ID** and **Client Secret**

### Step 4: Update Backend .env

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

---

## 2. Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** use case
4. App Display Name: **Mentora Student Portal**
5. App Contact Email: Your email
6. Click **Create App**

### Step 2: Add Facebook Login Product

1. In the app dashboard, find **Facebook Login**
2. Click **Set Up**
3. Select **Web** platform
4. Enter your site URL: `http://localhost:5173` (development)

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   - `http://localhost:3001/api/v1/auth/facebook/callback` (development)
   - `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/facebook/callback` (production)
3. Click **Save Changes**

### Step 4: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret**
3. Add your app domain:
   - App Domains: `localhost`, `mentora-consulting-student-web-api.vercel.app`
   - Website URL: `http://localhost:5173`

### Step 5: Update Backend .env

```env
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/v1/auth/facebook/callback
```

---

## 3. LinkedIn OAuth Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in the details:
   - App name: **Mentora Student Portal**
   - LinkedIn Page: Create or select a company page
   - App logo: Upload your logo
   - Legal agreement: Accept terms
4. Click **Create app**

### Step 2: Configure OAuth Settings

1. Go to **Auth** tab
2. Under **OAuth 2.0 settings**:
   - Add **Redirect URLs**:
     - `http://localhost:3001/api/v1/auth/linkedin/callback` (development)
     - `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/linkedin/callback` (production)

### Step 3: Request Access to Sign In with LinkedIn

1. Go to **Products** tab
2. Find **Sign In with LinkedIn using OpenID Connect**
3. Click **Request access**
4. Fill in the required information
5. Wait for approval (usually instant for development)

### Step 4: Get App Credentials

1. Go to **Auth** tab
2. Copy **Client ID** and **Client Secret**

### Step 5: Update Backend .env

```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
LINKEDIN_CALLBACK_URL=http://localhost:3001/api/v1/auth/linkedin/callback
```

---

## 4. Backend Configuration

### Complete .env File

Your backend `.env` file should have these OAuth configurations:

```env
# Session Configuration
SESSION_SECRET=mentora_session_secret_key_2025_change_this_in_production

# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/v1/auth/facebook/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3001/api/v1/auth/linkedin/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:5173
```

---

## 5. Production Deployment (Vercel)

### Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project: **mentora-consulting-student-web-api**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
SESSION_SECRET = your_production_session_secret
GOOGLE_CLIENT_ID = your_google_client_id
GOOGLE_CLIENT_SECRET = your_google_client_secret
GOOGLE_CALLBACK_URL = https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/google/callback
FACEBOOK_APP_ID = your_facebook_app_id
FACEBOOK_APP_SECRET = your_facebook_app_secret
FACEBOOK_CALLBACK_URL = https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/facebook/callback
LINKEDIN_CLIENT_ID = your_linkedin_client_id
LINKEDIN_CLIENT_SECRET = your_linkedin_client_secret
LINKEDIN_CALLBACK_URL = https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/linkedin/callback
FRONTEND_URL = https://mentora-consulting-student-web-core.pages.dev
```

5. Make sure to check **Production**, **Preview**, and **Development** for each variable
6. Click **Save**

### Update OAuth Providers

Don't forget to add production callback URLs to each provider:
- **Google**: Add Vercel URL to Authorized redirect URIs
- **Facebook**: Add Vercel URL to Valid OAuth Redirect URIs
- **LinkedIn**: Add Vercel URL to Redirect URLs

---

## 6. Testing OAuth Flow

### Local Testing

1. Start backend server:
   ```bash
   cd Mentora-Consulting-Student-Web-API
   npm start
   ```

2. Start frontend server:
   ```bash
   cd Mentora-Consulting-Student-Web-Core
   npm run dev
   ```

3. Navigate to `http://localhost:5173/auth`
4. Click on a social login button (Google, Facebook, or LinkedIn)
5. Complete OAuth flow
6. Should redirect back to dashboard with authenticated user

### Production Testing

1. Visit `https://mentora-consulting-student-web-core.pages.dev/auth`
2. Click on a social login button
3. Complete OAuth flow
4. Should redirect to dashboard

---

## 7. OAuth Flow Diagram

```
User clicks "Sign in with Google"
        ↓
Frontend redirects to: http://localhost:3001/api/v1/auth/google
        ↓
Backend redirects to: Google OAuth consent screen
        ↓
User grants permission
        ↓
Google redirects to: http://localhost:3001/api/v1/auth/google/callback
        ↓
Backend processes OAuth response
        ↓
Backend creates/updates user in database
        ↓
Backend generates JWT tokens
        ↓
Backend redirects to: http://localhost:5173/auth/callback?token=xxx&refreshToken=yyy
        ↓
Frontend OAuthCallbackPage extracts tokens
        ↓
Frontend stores tokens in localStorage
        ↓
Frontend fetches user profile
        ↓
Frontend updates Redux store
        ↓
Frontend redirects to dashboard
```

---

## 8. Troubleshooting

### Common Issues

**1. "redirect_uri_mismatch" error**
- Check that callback URLs match exactly in OAuth provider settings
- Include protocol (http:// or https://)
- Check for trailing slashes

**2. "Access blocked: This app's request is invalid"**
- Verify OAuth consent screen is configured
- Add test users in Google Cloud Console (for development)
- Make sure scopes are correctly configured

**3. "Cookies are disabled"**
- Enable cookies in browser
- Check session configuration in app.js

**4. "Token generation failed"**
- Verify JWT_SECRET and JWT_REFRESH_SECRET are set
- Check backend logs for errors

**5. User not redirecting to dashboard**
- Check FRONTEND_URL environment variable
- Verify frontend route `/auth/callback` exists
- Check browser console for errors

---

## 9. Security Best Practices

1. **Never commit OAuth secrets to Git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Use HTTPS in production**
   - Set `secure: true` in session cookies
   - OAuth providers require HTTPS for production

3. **Validate redirect URIs**
   - Only whitelist your own domains
   - Use exact matches, not wildcards

4. **Rotate secrets regularly**
   - Change OAuth secrets periodically
   - Update environment variables when rotating

5. **Monitor OAuth usage**
   - Check OAuth provider dashboards for unusual activity
   - Set up alerts for failed attempts

---

## 10. Support

For issues or questions:
- Backend API: Check logs in `logs/combined.log`
- Frontend: Check browser console
- OAuth Providers: Check respective developer consoles

**Documentation Links:**
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [LinkedIn OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
