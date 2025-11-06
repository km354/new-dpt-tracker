# Push to GitHub - Quick Start

Follow these steps to push your code to GitHub:

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `dpt-tracker` (or your preferred name)
4. Description: "DPT program application tracker"
5. Choose **Public** or **Private**
6. **DO NOT** check:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
   (We already have these files)
7. Click **"Create repository"**

## Step 2: Copy Repository URL

After creating the repository, GitHub will show you a page with commands. Copy the repository URL. It will look like:
- HTTPS: `https://github.com/yourusername/dpt-tracker.git`
- SSH: `git@github.com:yourusername/dpt-tracker.git`

## Step 3: Add Remote and Push

Run these commands in your terminal (replace with your repository URL):

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/yourusername/dpt-tracker.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If you're using SSH instead of HTTPS:
```bash
git remote add origin git@github.com:yourusername/dpt-tracker.git
git branch -M main
git push -u origin main
```

## Step 4: Verify

1. Go to your repository on GitHub
2. You should see all your files
3. Check that commits are visible in the history

## Troubleshooting

### Authentication Error

If you get an authentication error:

**For HTTPS:**
- Use a Personal Access Token instead of password
- Generate one at: GitHub Settings → Developer settings → Personal access tokens
- Use the token as your password when pushing

**For SSH:**
- Set up SSH keys: [GitHub SSH Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

### Remote Already Exists

If you get "remote origin already exists":

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/yourusername/dpt-tracker.git
```

### Push Rejected

If push is rejected:

```bash
# Pull first (if repository has content)
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

## Next Steps

After pushing to GitHub:

1. ✅ Continue with Vercel deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. ✅ Set up environment variables in Vercel
3. ✅ Configure automatic deployments

## Need Help?

- GitHub Docs: [docs.github.com](https://docs.github.com)
- Git Basics: [git-scm.com/doc](https://git-scm.com/doc)

