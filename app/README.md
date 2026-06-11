# Bar Hoppers — /app

Mobile-first webapp for planning overnight bar-hop trips from Ralston, NE:
browse 27 scored cities, vote city + hotel, and find the weekend everyone's free.
Live group sync via Supabase realtime, silent localStorage fallback offline.

This directory is a self-contained Next.js app — its own dependencies, deploy,
and `.claude/` docs. The repo root `index.html` is the v1 app and stays untouched.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (34 static pages)
npm run typecheck
```

Works out of the box — Supabase URL/anon key and the Google Maps key ship as
public fallbacks (same keys v1 uses). Override via env vars if needed
(see `.env.example`).

## Deploy (Vercel)

1. New Vercel project → repo `tacctile/drunk` → **Root Directory: `app/`**.
2. (Optional) set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. Supabase schema is already applied (migration `bar_hoppers_v2_schema`).
4. Recommended: restrict the Maps API key to the production domain.

## Where everything is

`.claude/CONTEXT.md` is the single source of truth (file map, schema, design
tokens, data model). `.claude/BUILD_INDEX.md` says which files to read per task.
