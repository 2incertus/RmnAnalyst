# Vercel Deployment & Caching Implementation Plan

This document provides a step-by-step guide for deploying the RMN Analyst application to Vercel, including the creation of a serverless backend and the integration of a caching layer with Vercel KV.

## 1. Project Structure Setup

We'll create a new `api` directory at the project root. Vercel automatically treats files within this directory as serverless functions.

```
/
|-- api/
|   |-- analyze.ts  // Our new serverless function
|-- components/
|-- services/
|-- App.tsx
|-- package.json
...
```

## 2. Create the Serverless Backend

The core logic from `services/geminiService.ts` will be moved into our new serverless function.

### `api/analyze.ts`

This file will:
1.  Handle incoming POST requests from the frontend.
2.  Securely access the `API_KEY` from Vercel's environment variables.
3.  Generate a unique cache key for the request (e.g., a hash of the file contents).
4.  Check Vercel KV for a cached result.
5.  If a cached result exists, return it.
6.  If not, call the Gemini API to perform the analysis.
7.  Store the new result in Vercel KV.
8.  Return the analysis to the frontend.

## 3. Refactor the Frontend

The `App.tsx` component will be updated to communicate with our new backend API instead of calling the Gemini service directly.

### `App.tsx` Changes

-   The `handleAnalyze` function will be modified to send a POST request to `/api/analyze` with the file contents in the request body.
-   The `geminiService.ts` file will be removed from the frontend, as its logic will now reside exclusively in the backend.

## 4. Set Up Vercel

### Deployment
1.  Create a new project on Vercel and connect it to your Git repository.
2.  Vercel will automatically detect the Vite configuration and set the build commands.

### Environment Variables
-   In the Vercel project settings, add a new environment variable named `API_KEY` with your Google Gemini API key.

### Vercel KV
1.  From the Vercel dashboard, create a new Vercel KV store.
2.  Connect the KV store to your project.
3.  Vercel will automatically provide the necessary environment variables to connect to the KV store from your serverless function.

## 5. Implementation Steps

Here is the final checklist for the implementation phase:

-   [ ] Create the `api/analyze.ts` serverless function.
-   [ ] Move the Gemini API logic to `api/analyze.ts`.
-   [ ] Implement caching with Vercel KV in `api/analyze.ts`.
-   [ ] Update `App.tsx` to call the new `/api/analyze` endpoint.
-   [ ] Remove the old `services/geminiService.ts` file.
-   [ ] Deploy the application to Vercel.
-   [ ] Configure environment variables and connect the Vercel KV store.

---

Please review this plan. If you approve, I will prepare to switch to "Code" mode to begin the implementation.