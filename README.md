# Dividend Tracker

A portfolio management tool for dividend investors. Track your stocks, monitor dividend yields, identify underperformers, and get AI-powered replacement suggestions — all in one place.

## Features

- **Portfolio Dashboard** — View your entire stock portfolio with real-time data
- **Dividend Yield Tracking** — Monitor dividend yields and set a custom target yield
- **Underperformer Detection** — Automatically flags stocks falling below your yield target
- **Replacement Suggestions** — Get suggestions for higher-yielding alternatives
- **User Authentication** — Secure login and signup with email verification
- **Persistent Storage** — Your portfolio is saved to the cloud and available across devices

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI, Lucide Icons
- **State Management:** TanStack React Query
- **Charts:** Recharts
- **Backend:** Lovable Cloud (database, authentication, edge functions)
- **Routing:** React Router

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or bun

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Contributing — Branch Workflow

We use **feature branches** to keep work organized. Every contributor works on their own branch and submits changes via pull requests.

### Step 1: Clone the Repository

If you haven't already, clone the repo to your local machine:

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Create Your Own Branch

Create a new branch from `main`. Name it descriptively — use your name or the feature you're working on:

```bash
# Make sure you're on the latest main branch first
git checkout main
git pull origin main

# Create and switch to your new branch
git checkout -b your-name/feature-description
# Examples:
#   git checkout -b jane/add-watchlist
#   git checkout -b mike/fix-yield-calculation
```

### Step 3: Make Your Changes

Edit files, add features, fix bugs — whatever you're working on. Commit often with clear messages:

```bash
git add .
git commit -m "Add watchlist feature to dashboard"
```

### Step 4: Push Your Branch to GitHub

```bash
git push origin your-name/feature-description
```

### Step 5: Open a Pull Request

1. Go to the repository on GitHub
2. You'll see a banner suggesting to create a pull request for your branch — click **"Compare & pull request"**
3. Add a title and description of your changes
4. Click **"Create pull request"**
5. Wait for review and approval before merging into `main`

### Working on Your Branch in Lovable

If you're using the Lovable editor instead of a local IDE:

1. Open the project in Lovable
2. Go to **Account Settings → Labs** and enable **GitHub Branch Switching**
3. Click the **project name** (top left) → **Settings** → **GitHub** tab
4. Select your branch from the dropdown
5. Any changes you make in Lovable will now be committed to your selected branch

> **Important:** Always make sure you're on your own branch before making changes. Avoid committing directly to `main`.

### Branch Naming Conventions

| Format | Example | Use Case |
|--------|---------|----------|
| `name/feature` | `jane/add-watchlist` | New features |
| `name/fix-description` | `mike/fix-login-bug` | Bug fixes |
| `name/update-description` | `alex/update-readme` | Updates & docs |

### Keeping Your Branch Up to Date

Periodically pull the latest changes from `main` into your branch to avoid conflicts:

```bash
git checkout your-name/feature-description
git pull origin main
```

Resolve any merge conflicts if they appear, then commit and push.

---

## Deployment

Open [Lovable](https://lovable.dev) and click **Share → Publish** to deploy the app.

## License

This project is private and proprietary.
