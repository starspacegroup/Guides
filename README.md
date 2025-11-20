# *Space Atlas

The atlas.starspace.group platform for creating sets of guides (e.g. UI/UX Patterns and the Principles that guide them).

## Overview

*Space Atlas is a SvelteKit application designed to help teams create and manage:
- **Principles**: Core guiding principles for design and development
- **Patterns**: Reusable patterns that implement one or more principles

## Technology Stack

- **SvelteKit**: Full-stack framework for building web applications
- **TypeScript**: Type-safe development
- **Cloudflare Pages + Workers**: Hosting and serverless compute platform

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```sh
npm install
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

The build output will be in `.svelte-kit/cloudflare/` directory, ready for deployment to Cloudflare Pages.

## Deployment

This application is configured for Cloudflare Pages deployment:

1. Connect your repository to Cloudflare Pages
2. Set the build command to: `npm run build`
3. Set the build output directory to: `.svelte-kit/cloudflare`
4. Deploy!

Cloudflare Pages will automatically build and deploy your application on every push to the main branch.

## Features

- **Browse Principles** at `/principles` - View all documented principles
- **Add Principles** - Create new guiding principles
- **Browse Patterns** at `/patterns` - Explore all patterns
- **Add Patterns** - Create patterns linked to principles
- **Principle-Pattern Relationships** - Patterns can reference multiple principles
