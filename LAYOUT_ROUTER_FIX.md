# Layout Router Fix Guide

## Issue
"invariant expected layout router to be mounted" error in Next.js 15.5.6

## All Fixes Applied

1. ✅ Removed metadata exports from nested layouts
2. ✅ Added suppressHydrationWarning to html/body
3. ✅ Separated GA4Tracker component with Suspense
4. ✅ Removed navigation hooks from Providers
5. ✅ Made PersistGate non-blocking
6. ✅ Added experimental config

## If Error Persists - Try These Steps:

### Step 1: Clear All Caches
```bash
cd front
rm -rf .next
rm -rf node_modules/.cache
```

### Step 2: Update Next.js (RECOMMENDED)
```bash
npm install next@latest react@latest react-dom@latest
```

### Step 3: If Still Failing - Temporary Workaround
The issue might be with Next.js 15.5.6 specifically. Try downgrading temporarily:
```bash
npm install next@15.0.0
```

### Step 4: Check Browser Console
Look for any other errors that might be causing the layout router to fail mounting.

### Step 5: Verify No Pages Directory
Ensure there's no `pages` directory conflicting with `app` directory.

## Current File Structure
- `front/src/app/layout.js` - Root layout (server component)
- `front/src/app/providers.jsx` - Client providers wrapper
- `front/src/components/GA4Tracker.jsx` - Separate GA tracking component

## If Nothing Works
This might be a bug in Next.js 15.5.6. Consider:
1. Reporting to Next.js GitHub
2. Using Next.js 15.0.0 or 15.1.0 instead
3. Waiting for Next.js 15.5.7+ update

