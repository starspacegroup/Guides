# Deployment Guide for Cloudflare Pages

This guide explains how to deploy the Atlas application to Cloudflare Pages.

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

Currently, the application doesn't require any environment variables. When you add database integration (D1 or KV), you'll need to configure those here.

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

### Adding Authentication

For private or team-based deployments:

1. Use Cloudflare Access for zero-trust authentication
2. Or integrate Auth0, Firebase Auth, or similar
3. Add authentication checks in `src/hooks.server.ts`

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
