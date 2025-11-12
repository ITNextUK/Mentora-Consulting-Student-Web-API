# Vercel Environment Variables Setup

## 🚨 CRITICAL: OAuth Not Working Because Environment Variables Are Missing

The OAuth authentication is failing with a **500 error** because the required environment variables are not set in Vercel.

## Step-by-Step Guide to Add Environment Variables to Vercel

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: `mentora-consulting-student-web-api`

### 2. Navigate to Environment Variables
1. Click on **Settings** tab
2. Click on **Environment Variables** in the left sidebar

### 3. Add Required OAuth Variables

You need to add the following environment variables:

#### Google OAuth (Required for Google Sign-in)
```
Variable Name: GOOGLE_CLIENT_ID
Value: 279155601536-75eaqc6vjftt8jp4avr6s7fv2s2o940k.apps.googleusercontent.com
Environment: Production, Preview, Development (select all)
```

```
Variable Name: GOOGLE_CLIENT_SECRET
Value: [Your Google Client Secret from Google Cloud Console]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: GOOGLE_CALLBACK_URL
Value: https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/google/callback
Environment: Production, Preview, Development (select all)
```

#### Session Management (Required)
```
Variable Name: SESSION_SECRET
Value: mentora_session_secret_key_2025_change_this_in_production
Environment: Production, Preview, Development (select all)
```

#### Frontend URL (Required)
```
Variable Name: FRONTEND_URL
Value: https://mentora-consulting-student-web-core.pages.dev
Environment: Production, Preview, Development (select all)
```

#### Facebook OAuth (Optional - if you want Facebook sign-in)
```
Variable Name: FACEBOOK_APP_ID
Value: [Your Facebook App ID]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: FACEBOOK_APP_SECRET
Value: [Your Facebook App Secret]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: FACEBOOK_CALLBACK_URL
Value: https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/facebook/callback
Environment: Production, Preview, Development (select all)
```

#### LinkedIn OAuth (Optional - if you want LinkedIn sign-in)
```
Variable Name: LINKEDIN_CLIENT_ID
Value: [Your LinkedIn Client ID]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: LINKEDIN_CLIENT_SECRET
Value: [Your LinkedIn Client Secret]
Environment: Production, Preview, Development (select all)
```

```
Variable Name: LINKEDIN_CALLBACK_URL
Value: https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/linkedin/callback
Environment: Production, Preview, Development (select all)
```

### 4. Save and Redeploy

After adding the environment variables:
1. Click **Save** for each variable
2. Go to **Deployments** tab
3. Click on the latest deployment
4. Click **Redeploy** → **Use existing Build Cache** → **Redeploy**

OR simply push a new commit and Vercel will automatically redeploy with the new environment variables.

### 5. Verify OAuth is Working

After redeployment (takes 2-3 minutes):
1. Visit: https://mentora-consulting-student-web-core.pages.dev/auth
2. Click **"Continue with Google"**
3. You should be redirected to Google's consent screen
4. Grant permissions
5. You should be redirected back to your app

## 📝 Where to Get the Credentials

### Google OAuth Credentials
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project (or create one)
3. Click on your OAuth 2.0 Client ID
4. Copy the **Client ID** and **Client Secret**
5. Make sure you have added the redirect URI:
   - `https://mentora-consulting-student-web-api.vercel.app/api/v1/auth/google/callback`

### Facebook OAuth Credentials
1. Go to: https://developers.facebook.com/apps
2. Select your app (or create one)
3. Go to **Settings** → **Basic**
4. Copy the **App ID** and **App Secret**
5. Make sure you have added the redirect URI in **Facebook Login** settings

### LinkedIn OAuth Credentials
1. Go to: https://www.linkedin.com/developers/apps
2. Select your app (or create one)
3. Go to **Auth** tab
4. Copy the **Client ID** and **Client Secret**
5. Make sure you have added the redirect URI

## 🔍 How to Check if Environment Variables Are Set

After adding the variables in Vercel:
1. Go to **Settings** → **Environment Variables**
2. You should see all the variables listed
3. Click on each to verify it's set for all environments

## ⚠️ Common Issues

### Issue: Still getting 500 error after adding variables
**Solution**: Make sure to redeploy after adding environment variables. The app needs to restart to pick up the new variables.

### Issue: "OAuth not configured" error
**Solution**: Check that you've selected all three environments (Production, Preview, Development) when adding the variables.

### Issue: Google OAuth redirects to wrong URL
**Solution**: Make sure the `GOOGLE_CALLBACK_URL` exactly matches what you configured in Google Cloud Console.

## ✅ Verification Checklist

Before testing OAuth:
- [ ] All required environment variables added to Vercel
- [ ] Variables set for all environments (Production, Preview, Development)
- [ ] Vercel redeployed after adding variables
- [ ] Google Cloud Console has correct redirect URI
- [ ] Google Client Secret copied correctly (no extra spaces)
- [ ] Waited 2-3 minutes for deployment to complete

## 🎯 Next Steps

Once you've added the environment variables and redeployed:
1. Test Google OAuth sign-in
2. Verify new users are redirected to profile completion
3. Verify returning users are redirected to dashboard
4. (Optional) Set up Facebook and LinkedIn OAuth

## 📞 Need Help?

If you're still having issues after following this guide:
1. Check Vercel deployment logs for errors
2. Check browser console for errors
3. Verify all environment variables are correctly set in Vercel dashboard
