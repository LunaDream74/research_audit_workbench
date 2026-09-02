# Deployment

Deploy `apps/api` and `apps/web` as separate Vercel projects. Both project roots contain an explicit framework configuration.

## API project

Set the project root to `apps/api` and configure these Production and Preview variables:

- `SUPABASE_URL`: the hosted Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: the hosted project's publishable key
- `ALLOWED_ORIGINS`: comma-separated web deployment origins; do not use `*`

The API validates every bearer token against Supabase Auth. Its `/health` route remains public for smoke checks.

## Web project

Set the project root to `apps/web`. Vercel includes workspace files outside that directory by default for current projects, which allows the web app to consume `packages/contracts`.

Configure these Production and Preview variables:

- `ANALYSIS_API_URL`: the matching FastAPI deployment origin
- `NEXT_PUBLIC_SUPABASE_URL`: the hosted Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the hosted project's publishable key

Never place a Supabase service-role key, Vercel token, or other privileged credential in a `NEXT_PUBLIC_` variable.

After both deployments are live, set `ALLOWED_ORIGINS` to the exact final web origins and redeploy the API. Then run the public demo, authenticated import, persistence, and API smoke checks before submission.
