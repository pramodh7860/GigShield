# GigShield Deployment Guide

## Overview
This guide covers deploying GigShield to production using:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Express + Node.js)
- **Database**: MongoDB Atlas (already configured)
- **Payments**: Stripe (test/production keys)

## Prerequisites
- GitHub account with repository access (already pushed)
- Vercel account (free tier available)
- Railway account (free tier available)
- Stripe account with API keys
- MongoDB Atlas cluster (already configured)

## Step 1: Prepare Backend for Production Build

The API server needs to be built before deployment:

```bash
# Install dependencies
pnpm install

# Build API server
pnpm --filter @workspace/api-server build
```

This creates `artifacts/api-server/build/index.js` that Railway will run.

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository: `pramodh7860/GigShield`
4. Railway will auto-detect and ask which service to deploy

### 2.2 Configure Railway Service
1. Select the root directory (not a subdirectory)
2. Set start command: `node -r dotenv/config build/index.js`
   - Note: Railway runs from project root, so specify full path if needed
3. Create environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DB_NAME`: `asset-explorer`
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_...)
   - `NODE_ENV`: `production`
   - `LOG_LEVEL`: `info`
   - `PORT`: Railway assigns automatically (can leave blank or set to 3000)

### 2.3 Deploy
- Railway auto-deploys on every push to master
- Your backend will be available at: `https://<railway-generated-domain>.railway.app`
- Copy this URL for Step 4

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import repository: `https://github.com/pramodh7860/GigShield`
4. Select Project Settings:
   - Framework: **Vite**
   - Root Directory: `artifacts/gigshield`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

### 3.2 Configure Environment Variables
In Vercel project settings → Environment Variables, add:
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (pk_test_...)
- `VITE_API_URL`: Your Railway backend URL (from Step 2.3)
  - Example: `https://gigshield-api.railway.app`

### 3.3 Deploy
- Vercel auto-deploys on every push to master
- Your frontend will be available at: `https://<your-project>.vercel.app`

## Step 4: Configure CORS & API Communication

### 4.1 Update Backend CORS
In `artifacts/api-server/src/app.ts`, ensure CORS allows your Vercel domain:

```typescript
app.use(cors({
  origin: ["https://<your-project>.vercel.app", "http://localhost:5173"],
  credentials: true
}));
```

### 4.2 Test API Connection
After deployment, test your frontend can reach the backend:
1. Open frontend in browser (Vercel URL)
2. Check Network tab in DevTools
3. Any `/api/*` request should reach Railway backend

## Step 5: Configure Deployment Workflow

### 5.1 Automatic Deployments
Both Vercel and Railway watch your GitHub repository:
- Any push to `master` triggers automatic deployment
- Check deployment logs if issues occur:
  - **Railway**: In project → Deployments tab
  - **Vercel**: In project → Deployments tab

### 5.2 Manual Deployment
If needed:

```bash
# Update code
git add .
git commit -m "Production fix"
git push origin master

# Both Vercel and Railway auto-deploy within 1-2 minutes
```

## Step 6: Upgrade to Production Keys (Optional)

When ready for production:

1. **Create Stripe Production Keys**
   - Stripe Dashboard → Developers → API Keys
   - Get production `sk_...` and `pk_...` keys

2. **Update Secrets**
   - Railway: Update `STRIPE_SECRET_KEY` with production key
   - Vercel: Update `VITE_STRIPE_PUBLISHABLE_KEY` with production key

3. **Enable Webhooks** (if needed)
   - Add Railway backend URL to Stripe Webhook Endpoints
   - Endpoint: `POST /api/webhooks/stripe`

## Troubleshooting

### 401 on Login
- **Issue**: No demo users exist
- **Fix**: Add seed data to MongoDB or create test account via signup

### 502 Bad Gateway from Frontend
- **Issue**: Backend URL incorrect or service down
- **Fix**: 
  1. Check `VITE_API_URL` is correct in Vercel env vars
  2. Verify Railway deployment succeeded
  3. Test backend directly: `curl https://<railway-url>/api/health`

### CORS Errors in Browser Console
- **Issue**: Frontend domain not allowed by backend
- **Fix**: Update `cors()` config in `artifacts/api-server/src/app.ts` with Vercel domain

### Stripe Payment Element Not Loading
- **Issue**: Invalid publishable key or CORS blocked
- **Fix**:
  1. Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set and valid
  2. Check browser console for Stripe error messages
  3. Ensure backend CORS allows origin

### Database Connection Timeout
- **Issue**: MongoDB Atlas IP whitelist or network issue
- **Fix**:
  1. MongoDB Atlas Dashboard → Network Access
  2. Allow Railway IP: Add `0.0.0.0/0` or specific Railway IP
  3. Test connection: `mongo "mongodb+srv://..." --eval "db.adminCommand('ping')"`

## Monitoring

### Check Backend Health
```bash
curl https://<railway-url>/api/health
```

### Check Frontend Deployment
Visit `https://<your-project>.vercel.app` and verify:
- [ ] Page loads without errors
- [ ] Network tab shows API requests to correct backend
- [ ] Stripe publishable key is valid (check console)
- [ ] Authentication works (login/logout)

### View Logs
- **Railway Backend**: Project → Deployments → View Logs
- **Vercel Frontend**: Project → Deployments → Click deployment → View Logs

## Rollback

If deployment breaks:

### Railway Rollback
1. Go to Deployments tab
2. Find previous successful deployment
3. Click three-dots menu → "Redeploy"

### Vercel Rollback
1. Go to Deployments tab
2. Find previous successful deployment
3. Click three-dots menu → "Redeploy"

Or revert code and push to master:
```bash
git revert <commit-hash>
git push origin master
```

## Next Steps

After deployment:
1. ✅ Test user flows end-to-end
2. ✅ Verify Stripe payments work
3. ✅ Check analytics/logs
4. ✅ Set up monitoring alerts
5. ✅ Document production URLs for team
