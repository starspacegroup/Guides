# GitHub SSO Authentication Setup Guide

## Quick Start

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `*Space Atlas` (or your choice)
   - **Homepage URL**:
     - Development: `http://localhost:4242`
     - Production: `https://your-domain.pages.dev`
   - **Authorization callback URL**:
     - Development: `http://localhost:4242/api/auth/github/callback`
     - Production: `https://your-domain.pages.dev/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

### 2. Generate AUTH_SECRET

Run in terminal:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Set Environment Variables

#### For Local Development:

Create `.env` file in the project root:

```env
AUTH_SECRET=your-generated-secret-from-step-2
AUTH_GITHUB_ID=your-client-id-from-step-1
AUTH_GITHUB_SECRET=your-client-secret-from-step-1
AUTHORIZED_USER_NAME=your-github-username
```

#### For Cloudflare Pages:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** > **Environment variables**
3. Add all four variables above
4. Add them to both **Production** and **Preview** environments
5. Redeploy your application

### 5. Test the Setup

1. Start the dev server: `npm run dev`
2. Visit http://localhost:4242
3. You should see a "Sign In with GitHub" button in the navigation bar
4. Click it and authorize the application
5. After signing in, you should see your name/avatar and the "Add Principle" /
   "Add Pattern" buttons
6. Other users can sign in but won't see the edit/create buttons

## How It Works

### Access Levels

1. **Unauthenticated Users** (Public)
   - Can view all principles and patterns
   - No sign-in required for read-only access

2. **Authenticated Users** (Any GitHub user)
   - Can sign in with GitHub
   - Can view all content
   - Cannot create, edit, or delete anything

3. **Authorized User** (You only - via AUTHORIZED_USER_NAME)
   - Can sign in with GitHub
   - Can view all content
   - Can create new principles and patterns
   - Can edit existing principles and patterns
   - Sees "Add" and "Edit" buttons in the UI

### Security Features

- ✅ Server-side authentication via Auth.js (SvelteKit)
- ✅ GitHub OAuth 2.0 flow
- ✅ Session management with secure cookies
- ✅ Authorization checks on all CRUD operations
- ✅ 403 Forbidden responses for unauthorized attempts
- ✅ Conditional UI rendering (no edit buttons for unauthorized users)
- ✅ Environment variable protection (secrets never exposed to client)

## Files Modified

- `src/hooks.server.ts` - Auth.js setup and session handling
- `src/app.d.ts` - TypeScript types for session and platform
- `src/lib/auth.ts` - Authorization helper functions
- `src/routes/+layout.svelte` - Sign in/out UI
- `src/routes/+layout.server.ts` - Pass session to all pages
- `src/routes/patterns/+page.server.ts` - Protected CRUD operations
- `src/routes/principles/+page.server.ts` - Protected CRUD operations
- `src/routes/patterns/+page.svelte` - Conditional UI elements
- `src/routes/principles/+page.svelte` - Conditional UI elements
- `.env.example` - Environment variable template
- `README.md` - Updated setup instructions
- `DEPLOYMENT.md` - Cloudflare Pages deployment with auth

## Troubleshooting

### "Cannot find package '@auth/sveltekit'"

Run: `npm install`

### "Unauthorized: Only the admin can perform this action"

- Verify your GitHub username is correct (your login name, e.g., @yourusername)
- Check that AUTHORIZED_USER_NAME matches your GitHub username exactly
- Ensure environment variables are set correctly

### OAuth redirect errors

- Check callback URLs in GitHub OAuth App settings
- Must match exactly: `http://localhost:4242/api/auth/callback/github`
- For production, update to your Cloudflare Pages domain with
  `/api/auth/callback/github`

### Session not persisting

- Verify AUTH_SECRET is set and is a strong random value
- Check browser cookies are enabled
- Clear cookies and try again

## Next Steps

To allow multiple users to edit:

1. Change `AUTHORIZED_USER_NAME` to comma-separated usernames:
   `"user1,user2,user3"`
2. Update `src/lib/auth.ts` to split and check array:
   ```typescript
   const authorizedNames = authorizedUserName.split(",");
   return authorizedNames.includes(session.user.name);
   ```
