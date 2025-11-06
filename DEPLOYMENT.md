# Deployment Guide

This guide will walk you through deploying the DPT Tracker application to Vercel with automatic deployments from GitHub.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- A Supabase project (already created)

## Step 1: Push to GitHub

### Option A: Create a new GitHub repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `dpt-tracker` (or your preferred name)
3. **Do not** initialize it with a README, .gitignore, or license (we already have these)
4. Copy the repository URL (e.g., `https://github.com/yourusername/dpt-tracker.git`)

### Option B: Use existing repository

If you already have a GitHub repository, use its URL.

### Push your code

```bash
# Add the remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/dpt-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account if prompted
5. Select your `dpt-tracker` repository
6. Click **"Import"**

## Step 3: Configure Vercel Project

### Build Settings

Vercel should automatically detect Vite. Verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables

Before deploying, add your Supabase environment variables:

1. In the project settings, scroll to **"Environment Variables"**
2. Add the following variables:

   ```
   VITE_SUPABASE_URL = https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   ```

3. **Important**: Add these for all three environments:
   - Production
   - Preview
   - Development

4. To find your Supabase credentials:
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** → `VITE_SUPABASE_URL`
     - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, Vercel will provide you with a URL like:
   - Production: `https://dpt-tracker.vercel.app`
   - Preview: `https://dpt-tracker-git-branch-username.vercel.app`

## Step 4: Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches and pull requests

### Preview Deployments

- Each pull request gets its own preview URL
- Preview deployments use the same environment variables as production
- You can test changes before merging to main

## Step 5: Custom Domain (Optional)

### Add Custom Domain

1. In your Vercel project, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `dpttracker.com`)
4. Follow the DNS configuration instructions

### DNS Configuration

Vercel will provide DNS records to add:

**Option A: Root Domain**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Option B: Subdomain (www)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Verify Domain

1. Add the DNS records to your domain registrar
2. Wait for DNS propagation (can take up to 48 hours, usually much faster)
3. Vercel will automatically issue an SSL certificate

## Troubleshooting

### Build Failures

If the build fails:

1. Check the build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors (run `npm run build` locally first)
   - Missing dependencies

### Environment Variables Not Working

1. Ensure variables are prefixed with `VITE_` (required for Vite)
2. Verify they're added to all environments (Production, Preview, Development)
3. Redeploy after adding new variables

### Supabase Connection Issues

1. Verify your Supabase URL and key are correct
2. Check Supabase dashboard for any service issues
3. Ensure RLS policies are configured correctly
4. Check browser console for specific error messages

## Security Notes

- Never commit `.env` files to Git
- Use Vercel's environment variables for all secrets
- The `VITE_SUPABASE_ANON_KEY` is safe to expose (it's public)
- RLS (Row Level Security) protects your data

## Next Steps

After deployment:

1. Test the production URL
2. Verify authentication works
3. Test creating schools, applications, etc.
4. Set up monitoring (optional)
5. Configure custom domain (optional)

## Support

For issues:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)
- GitHub Issues: Create an issue in your repository

