# Deploying to Vercel

## Prerequisites
1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. Push your code to GitHub

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `Mentora-Consulting-Student-Web-API` folder

2. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `Mentora-Consulting-Student-Web-API` (if in monorepo)
   - **Build Command:** Leave empty or use `npm install`
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

3. **Add Environment Variables:**
   Go to Project Settings → Environment Variables and add:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   API_PREFIX=/api/v1
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your API will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy to Production:**
   ```bash
   cd Mentora-Consulting-Student-Web-API
   vercel --prod
   ```

3. **Add Environment Variables:**
   ```bash
   vercel env add NODE_ENV
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add JWT_REFRESH_SECRET
   vercel env add CORS_ORIGIN
   ```

## Important Notes

### 1. MongoDB Connection
- Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Vercel's IP addresses
- Use MongoDB Atlas (cloud) - local MongoDB won't work with Vercel

### 2. File Uploads
- Vercel has a **read-only file system**
- File uploads (CV, profile pictures) won't persist across deployments
- **Solution:** Use cloud storage like:
  - **Cloudinary** (recommended for images/files)
  - **AWS S3**
  - **Vercel Blob Storage**

### 3. CORS Configuration
- Update `CORS_ORIGIN` in environment variables to your frontend domain
- Example: `https://your-frontend.vercel.app`
- For multiple origins, modify `app.js`:
  ```javascript
  const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true
  };
  ```

### 4. API Endpoints
- Your API will be available at: `https://your-project.vercel.app/api/v1`
- Health check: `https://your-project.vercel.app/health`

### 5. Update Frontend
After deploying backend, update your frontend's API URL:
```typescript
// In Mentora-Consulting-Student-Web-Core/.env
VITE_API_BASE_URL=https://your-backend.vercel.app/api/v1
```

## Testing Your Deployment

1. **Health Check:**
   ```bash
   curl https://your-project.vercel.app/health
   ```

2. **API Test:**
   ```bash
   curl https://your-project.vercel.app/api/v1/courses/meta/degree-levels
   ```

## Troubleshooting

### Issue: MongoDB Connection Timeout
**Solution:** Add Vercel's IP ranges to MongoDB Atlas Network Access

### Issue: CORS Errors
**Solution:** 
1. Check `CORS_ORIGIN` environment variable
2. Ensure it matches your frontend domain exactly
3. Include protocol (https://)

### Issue: File Upload Fails
**Solution:** Implement cloud storage (see Note #2 above)

### Issue: Cold Starts
**Solution:** Serverless functions have cold starts. First request may be slower (5-10 seconds).

## Monitoring

- View logs in Vercel Dashboard → Your Project → Deployments → Logs
- Monitor function execution time and errors
- Set up alerts for failed deployments

## Automatic Deployments

Vercel automatically deploys when you:
- Push to `main` branch (production)
- Push to other branches (preview deployments)

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `CORS_ORIGIN` to match new domain
