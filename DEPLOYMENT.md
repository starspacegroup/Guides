# Deployment Guide for Cloudflare Pages

This guide explains how to deploy the *Space Atlas application to Cloudflare
Pages.

## Prerequisites

- A Cloudflare account (free tier is sufficient)
- Access to the GitHub repository

## Deployment Steps

### 1. Connect Repository to Cloudflare Pages

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create application** > **Pages** > **Connect to Git**
4. Select your GitHub account and authorize Cloudflare
5. Choose the `starspacegroup/Atlas` repository
6. Click **Begin setup**

### 2. Configure Build Settings

Set the following build configuration:

- **Production branch**: `main` (or your preferred branch)
- **Build command**: `npm run build`
- **Build output directory**: `.svelte-kit/cloudflare`
- **Root directory**: (leave empty)

### 3. Environment Variables

The application requires the following environment variables for GitHub OAuth
authentication:

1. In your Cloudflare Pages project, go to **Settings** > **Environment
   variables**
2. Add the following variables (for both Production and Preview):

   - `AUTH_SECRET`: A random secret key for signing tokens
     - Generate with: `openssl rand -base64 32`
     - Example: `dGhpcyBpcyBhIHNlY3JldCBrZXkgZm9yIGF1dGg=`

   - `AUTH_GITHUB_ID`: Your GitHub OAuth App Client ID
     - Create OAuth App at: https://github.com/settings/developers
     - For production: Set callback URL to
       `https://your-domain.pages.dev/auth/callback/github`

   - `AUTH_GITHUB_SECRET`: Your GitHub OAuth App Client Secret
     - Generated when you create the OAuth App

   - `AUTHORIZED_USER_NAME`: Your GitHub username (the only user who can CRUD)
     - Your GitHub login name (e.g., if your profile is github.com/john, use
       "john")

3. **Important**: For preview deployments, you may want to create a separate
   GitHub OAuth App with the preview domain callback URL.

### 4. Deploy

1. Click **Save and Deploy**
2. Cloudflare Pages will automatically build and deploy your application
3. You'll receive a unique URL (e.g., `atlas.pages.dev`)
4. Future commits to the main branch will trigger automatic deployments

## Custom Domain (Optional)

To use a custom domain like `atlas.starspace.group`:

1. Go to your Pages project in the Cloudflare dashboard
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter `atlas.starspace.group`
5. Follow the DNS configuration instructions
6. Wait for SSL certificate provisioning (usually a few minutes)

## Authentication Setup Complete

The application now includes:

- ✅ GitHub OAuth authentication via Auth.js
- ✅ Single authorized user access control
- ✅ Protected CRUD operations
- ✅ Public read access for all users
- ✅ Conditional UI (edit buttons only for authorized user)

## Future Enhancements

### Adding Database Support

The current implementation uses in-memory storage. For production, consider:

#### Option 1: Cloudflare D1 (SQL)

- Best for: Structured data, complex queries
- Add D1 binding in Cloudflare Pages settings
- Update `src/lib/store.ts` to use D1 SQL queries

#### Option 2: Cloudflare KV (Key-Value)

- Best for: Simple key-value storage, high read performance
- Add KV namespace binding in Cloudflare Pages settings
- Update `src/lib/store.ts` to use KV API

#### Option 3: Cloudflare Durable Objects

- Best for: Strong consistency, collaborative features
- Requires more complex setup
- Great for real-time collaboration on principles/patterns

### Extending Authentication

Current implementation uses GitHub OAuth with single-user authorization. To
extend:

1. **Multiple Authorized Users**:
   - Change `AUTHORIZED_USER_NAME` to a comma-separated list of usernames
   - Update `src/lib/auth.ts` to check against the list

2. **Team-Based Access**:
   - Use GitHub Organization membership checks
   - Add GitHub Teams API integration
   - Implement role-based permissions

3. **Additional OAuth Providers**:
   - Add other providers (Google, Azure AD, etc.) to `src/hooks.server.ts`
   - Update Auth.js configuration

## Monitoring & Analytics

Cloudflare Pages includes built-in analytics:

1. Navigate to your Pages project
2. Click **Analytics** to see:
   - Page views
   - Unique visitors
   - Requests over time
   - Cache hit ratios

## Troubleshooting

### Build Failures

If the build fails:

1. Check the build logs in Cloudflare dashboard
2. Ensure Node.js version compatibility (18+)
3. Verify all dependencies are in `package.json`

### Runtime Errors

If the deployed app has errors:

1. Check the **Functions** logs in Cloudflare dashboard
2. Use `console.log()` for debugging (visible in logs)
3. Test locally with `npm run preview` after building

### Performance Issues

If the app is slow:

1. Check Cloudflare Analytics for bottlenecks
2. Enable caching headers for static assets
3. Optimize images and assets
4. Consider using Cloudflare Images for image optimization

## Support

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
