# Free deployment research

## Recommendation

For a client-demo-only project, host the React/Vite frontend on Netlify’s free plan and host the FastAPI backend as a Render Free web service. Netlify is appropriate for the static client. Render supports Python web services, Git-based deploys, public HTTPS, environment variables, and health checks, but its free service sleeps after 15 minutes of inactivity and its local filesystem is ephemeral.

## Important consequence

The current backend stores uploaded PDFs, the document registry, and Qdrant files under `backend/data`. On Render Free, those local files can disappear when the service restarts, redeploys, or sleeps. This is acceptable for a portfolio/client demo if the demo uploads a sample PDF again when needed, but it is not a production persistence strategy.

## Sources

- Netlify pricing: https://www.netlify.com/pricing/
- Netlify build configuration overview: https://docs.netlify.com/build/configure-builds/overview/
- Netlify monorepos: https://docs.netlify.com/build/configure-builds/monorepos/
- Render free services: https://render.com/docs/free
- Render web services: https://render.com/docs/web-services
- Render FastAPI deployment: https://render.com/docs/deploy-fastapi
- Railway pricing: https://railway.com/pricing

## Decision

Do not use Railway for this requirement because its current free plan includes only $1 of monthly usage credits and usage is metered. Do not use Hugging Face Spaces as the primary backend because the current free hardware situation is not a stable fit for this FastAPI + Qdrant service. Render Free is the simplest free demo option, with the explicit sleep and ephemeral-storage limitations documented.
