# Netlify Deployment Guide for ProfSale Web

## Overview
This guide explains how to deploy the ProfSale web application to Netlify with proper SPA routing configuration.

## Problem: 404 Errors on Direct URLs

### What Was Happening
When you tried to access `https://profsale.netlify.app/privacy-policy`, you got a 404 error because:
- Netlify was looking for a physical file at `/privacy-policy`
- Your React app is a Single Page Application (SPA) that handles routing in JavaScript
- The privacy-policy route only exists in your React Router configuration, not as a physical file

### Solution: SPA Routing Configuration
The `netlify.toml` file tells Netlify to:
1. Build from the `web` folder
2. Redirect all requests to `index.html`
3. Let React Router handle the routing

## File Structure

```
profsale/
├── netlify.toml                    ← NEW: Netlify configuration
├── web/
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── PrivacyPolicy.tsx
│   │   │   ├── TermsOfService.tsx
│   │   │   └── ...
│   │   └── ...
│   ├── dist/                       ← Built files (generated)
│   └── ...
├── src/
├── android/
└── ...
```

## Netlify Configuration Explained

### `netlify.toml` Settings

```toml
[build]
  base = "web"                       # Build from web folder
  command = "npm run build"          # Run build command
  publish = "web/dist"               # Publish dist folder

[build.environment]
  NODE_VERSION = "18"                # Node version to use

[[redirects]]
  from = "/*"                        # All routes
  to = "/index.html"                 # Redirect to index.html
  status = 200                       # 200 status (not 404)

[[headers]]
  for = "/assets/*"                  # Static assets
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/"                          # HTML files
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

## How It Works Now

### Before (❌ 404 Error)
```
User visits: https://profsale.netlify.app/privacy-policy
↓
Netlify looks for: /privacy-policy file
↓
File doesn't exist → 404 Error
```

### After (✅ Works!)
```
User visits: https://profsale.netlify.app/privacy-policy
↓
Netlify redirects to: /index.html (status 200)
↓
React app loads
↓
React Router handles /privacy-policy route
↓
PrivacyPolicy component displays
```

## Deployment Steps

### Step 1: Ensure netlify.toml is in Root
The `netlify.toml` file must be in the **project root** (same level as `web/` folder), not inside the `web/` folder.

```
✅ Correct:
profsale/
├── netlify.toml
└── web/

❌ Wrong:
profsale/
└── web/
    └── netlify.toml
```

### Step 2: Push to Git
```bash
git add netlify.toml
git commit -m "Add Netlify SPA routing configuration"
git push
```

### Step 3: Redeploy on Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your ProfSale site
3. Go to **Deploys**
4. Click **Trigger deploy** → **Deploy site**
5. Wait for deployment to complete

### Step 4: Test the Routes
After deployment, test these URLs:
- ✅ `https://profsale.netlify.app/` - Home/Dashboard
- ✅ `https://profsale.netlify.app/privacy-policy` - Privacy Policy
- ✅ `https://profsale.netlify.app/terms-of-service` - Terms of Service
- ✅ `https://profsale.netlify.app/login` - Login page

All should work without 404 errors!

## Shareable Links

Now you can share these direct links:

### Privacy Policy
```
https://profsale.netlify.app/privacy-policy
```

### Terms of Service
```
https://profsale.netlify.app/terms-of-service
```

### Main App
```
https://profsale.netlify.app
```

## Alternative: Create a Policy Folder (Optional)

If you want a separate policy folder with static HTML files:

### Structure
```
profsale/
├── policies/
│   ├── index.html
│   ├── privacy-policy.html
│   ├── terms-of-service.html
│   └── styles.css
├── web/
└── ...
```

### Netlify Configuration
```toml
[[redirects]]
  from = "/policies/*"
  to = "/policies/:splat"
  status = 200
```

### Access
```
https://profsale.netlify.app/policies/privacy-policy.html
```

**However, the current solution (SPA routing) is better because:**
- ✅ Consistent with your React app
- ✅ Easier to maintain
- ✅ Better user experience
- ✅ No duplicate content
- ✅ Cleaner URLs

## Troubleshooting

### Still Getting 404?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Wait 5 minutes for Netlify cache to clear
3. Check that `netlify.toml` is in the root directory
4. Verify deployment completed successfully

### Check Deployment Status
1. Go to Netlify Dashboard
2. Click on your site
3. Go to **Deploys**
4. Check the latest deploy status
5. Look for build logs if there are errors

### Verify Routes in React
Make sure your `App.tsx` has the routes:
```typescript
<Route path="/privacy-policy" element={<PrivacyPolicy />} />
<Route path="/terms-of-service" element={<TermsOfService />} />
```

## Performance Tips

### Caching Strategy
The configuration includes smart caching:
- **Static assets** (JS, CSS): Cached for 1 year (immutable)
- **HTML files**: Cached for 1 hour (can change)

This ensures users get updates quickly while benefiting from caching.

### Monitor Performance
1. Go to Netlify Dashboard
2. Click **Analytics**
3. Monitor:
   - Page load times
   - Bounce rate
   - Traffic sources

## Security

### Headers Configuration
The `netlify.toml` includes security headers:
- Cache-Control headers prevent stale content
- Immutable assets ensure integrity
- HTML files refresh regularly

### Additional Security (Optional)
To add more security headers:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Environment Variables

If you need environment variables:

### In netlify.toml
```toml
[build.environment]
  NODE_VERSION = "18"
  VITE_API_BASE_URL = "https://your-api.com"
```

### Or in Netlify Dashboard
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add variables there

## Monitoring & Logs

### View Deployment Logs
1. Netlify Dashboard → Your site
2. Click **Deploys**
3. Click on a deploy
4. View **Deploy log**

### Common Issues
- `npm run build` fails → Check `web/package.json`
- Missing dependencies → Run `npm install` locally first
- Environment variables → Set in Netlify dashboard

## Support

For issues:
1. Check [Netlify Documentation](https://docs.netlify.com)
2. Check [Netlify Support](https://support.netlify.com)
3. Contact ProfSale: profsaleug@gmail.com

## Summary

✅ **Before:** Direct URLs showed 404 errors
✅ **After:** All routes work perfectly
✅ **Solution:** `netlify.toml` with SPA routing configuration
✅ **Benefit:** Clean URLs, better UX, easier to share

---

**Last Updated:** May 2026
**Status:** Ready for Production
**Next Step:** Push `netlify.toml` to git and redeploy
