# Quick OAuth Setup Reference

## ✅ What's Been Implemented

### Backend (API)
- ✅ Passport.js integration with Google, Facebook, and LinkedIn strategies
- ✅ OAuth routes (`/api/v1/auth/google`, `/facebook`, `/linkedin`)
- ✅ JWT token generation after OAuth success
- ✅ Session management
- ✅ Student model updated with OAuth provider IDs
- ✅ Automatic user creation/linking on OAuth login

### Frontend (Web)
- ✅ OAuth callback page (`/auth/callback`)
- ✅ Social login buttons redirect to backend OAuth endpoints
- ✅ Token storage and Redux state management
- ✅ Toast notifications for OAuth success/failure
- ✅ Automatic redirect to dashboard after successful OAuth

---

## 🚀 Quick Start (15 minutes)

### 1. Google OAuth (5 minutes)
```bash
1. Go to: https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Credentials → Create OAuth client ID
4. Add redirect URI: http://localhost:3001/api/v1/auth/google/callback
5. Copy Client ID & Secret
```

### 2. Facebook OAuth (5 minutes)
```bash
1. Go to: https://developers.facebook.com/
2. My Apps → Create App → Consumer
3. Add Facebook Login product
4. Add redirect URI: http://localhost:3001/api/v1/auth/facebook/callback
5. Copy App ID & Secret
```

### 3. LinkedIn OAuth (5 minutes)
```bash
1. Go to: https://www.linkedin.com/developers/
2. Create app → Fill details
3. Auth tab → Add redirect URI: http://localhost:3001/api/v1/auth/linkedin/callback
4. Products → Request "Sign In with LinkedIn"
5. Copy Client ID & Secret
```

---

## 📝 Environment Variables

**Backend `.env` file:**
```env
# Session
SESSION_SECRET=your_random_secret_here

# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/v1/auth/facebook/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3001/api/v1/auth/linkedin/callback

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 🔧 Testing Locally

```bash
# Terminal 1 - Backend
cd Mentora-Consulting-Student-Web-API
npm start

# Terminal 2 - Frontend
cd Mentora-Consulting-Student-Web-Core
npm run dev

# Browser
Open http://localhost:5173/auth
Click "Continue with Google/Facebook/LinkedIn"
```

---

## 🌐 Production Deployment

### Vercel (Backend)
Add these environment variables in Vercel dashboard:
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` = `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/google/callback`
- `FACEBOOK_CALLBACK_URL` = `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/facebook/callback`
- `LINKEDIN_CALLBACK_URL` = `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/linkedin/callback`
- `FRONTEND_URL` = `https://mentora-consulting-student-web-core.pages.dev`

### Update OAuth Providers
Add production callback URLs in:
- Google Cloud Console → Authorized redirect URIs
- Facebook Developers → Valid OAuth Redirect URIs
- LinkedIn Developers → Redirect URLs

---

## 📱 OAuth Flow

```
User → Click "Sign in with Google" 
     → Backend redirects to Google
     → User authorizes
     → Google redirects back to backend callback
     → Backend creates/updates user
     → Backend generates JWT tokens
     → Backend redirects to frontend callback
     → Frontend stores tokens
     → Frontend redirects to dashboard
```

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| **redirect_uri_mismatch** | Verify callback URLs match exactly in OAuth provider |
| **Invalid client** | Check Client ID/Secret are correct |
| **Access blocked** | Add test users in OAuth provider (development) |
| **CORS error** | Verify CORS_ORIGIN includes frontend URL |
| **Session error** | Check SESSION_SECRET is set |

---

## 📚 Full Documentation

For detailed setup instructions, see:
- `OAUTH_SETUP_GUIDE.md` - Complete step-by-step guide
- Provider docs: Google, Facebook, LinkedIn

---

## 🎯 Next Steps

1. **Get OAuth credentials** from providers (15 min)
2. **Update .env file** with credentials
3. **Test locally** - Try each provider
4. **Deploy to production** - Update Vercel env vars
5. **Update provider settings** with production URLs
6. **Test production** - Verify all providers work

---

## 💡 Pro Tips

- Use different OAuth apps for dev/prod environments
- Enable MFA on OAuth provider accounts
- Rotate secrets every 3-6 months
- Monitor OAuth usage in provider dashboards
- Test OAuth flow in incognito mode

---

**Need help?** Check the logs:
- Backend: `logs/combined.log`
- Frontend: Browser console
- OAuth: Provider developer dashboards
