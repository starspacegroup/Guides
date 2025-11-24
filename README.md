# *Space Atlas

The atlas.starspace.group platform for creating sets of guides (e.g. UI/UX
Patterns and the Principles that guide them).

## Overview

*Space Atlas is a SvelteKit application designed to help teams create and
manage:

- **Principles**: Core guiding principles for design and development
- **Patterns**: Reusable patterns that implement one or more principles

## Technology Stack

- **SvelteKit**: Full-stack framework for building web applications
- **TypeScript**: Type-safe development
- **Cloudflare Pages + Workers**: Hosting and serverless compute platform

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- GitHub account for authentication

### Installation

```sh
npm install
```

### Environment Setup

This application uses GitHub OAuth for authentication. Only the authorized user
can create, update, or delete content.

1. **Create a GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set Application name: `*Space Atlas` (or your preferred name)
   - Set Homepage URL: `http://localhost:5173` (for development)
   - Set Authorization callback URL:
     `http://localhost:5173/auth/callback/github`
   - Click "Register application"
   - Copy the Client ID and generate a Client Secret

2. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`
   - Fill in the values:
     ```sh
     AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
     AUTH_GITHUB_ID=your-github-client-id
     AUTH_GITHUB_SECRET=your-github-client-secret
     AUTHORIZED_USER_NAME=your-github-username
     ```

### Development

Start the development server:

```sh
npm run dev
```

Visit http://localhost:5173 to see the application.

### Building

Create a production build:

```sh
npm run build
```

The build output will be in `.svelte-kit/cloudflare/` directory, ready for
deployment to Cloudflare Pages.

## Deployment

This application is configured for Cloudflare Pages deployment:

1. Connect your repository to Cloudflare Pages
2. Set the build command to: `npm run build`
3. Set the build output directory to: `.svelte-kit/cloudflare`
4. Deploy!

Cloudflare Pages will automatically build and deploy your application on every
push to the main branch.

## Features

- **GitHub OAuth Authentication** - Secure login with GitHub
- **Role-Based Access Control** - Only authorized user can create/edit/delete
- **Browse Principles** at `/principles` - View all documented principles
  (public)
- **Add Principles** - Create new guiding principles (authorized user only)
- **Browse Patterns** at `/patterns` - Explore all patterns (public)
- **Add Patterns** - Create patterns linked to principles (authorized user only)
- **Principle-Pattern Relationships** - Patterns can reference multiple
  principles

## Authentication & Authorization

The application implements GitHub SSO (Single Sign-On) with the following access
levels:

- **Public (Unauthenticated)**: Can view all principles and patterns
- **Authenticated Users**: Can sign in with GitHub, view all content
- **Authorized User**: Only the user specified in `AUTHORIZED_USER_NAME` can
  create, update, or delete principles and patterns

The authorized user sees additional UI elements:

- "Add Principle" / "Add Pattern" buttons
- "Edit" buttons on each item
- Forms for creating and editing content
