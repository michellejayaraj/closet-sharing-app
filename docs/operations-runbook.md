# Operations runbook

## Release checks

Every pull request and push to `main` runs the same lint, formatting, tests,
migration-manifest validation, Expo Doctor, and cache-cleared web export.

Before a production deployment:

1. Confirm `.env.local` contains the production project URL and a public
   anon/publishable key.
2. Run `npm run deploy:web:production`.
3. Confirm the command reports the production project ref
   `wdbrmpsvgintnpvezkrv`.
4. Smoke-test `/`, `/reset-password`, login, group joining, image upload,
   borrowing, and returning.

The deployment command refuses to continue if it sees staging credentials,
secret-key prefixes, a stale staging reference in the bundle, or a build that
was not produced for the production project.

## Supabase migration history

The seven migrations in `supabase/migration-history.json` were applied and
verified manually in both hosted projects. The Supabase CLI history table still
needs to be reconciled before using `supabase db push`.

For each project separately:

1. Confirm a recoverable database backup exists.
2. Link the CLI and verify the displayed project ref:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase migration list --linked
   ```

3. Mark the seven versions as applied without rerunning their SQL:

   ```bash
   npx supabase migration repair --linked --status applied \
     20260723220000 20260723221000 20260725200000 \
     20260725201000 20260725202000 20260725203000 \
     20260725204000
   ```

4. Run `npx supabase migration list --linked` again and compare it with
   `supabase/migration-history.json`.

Do staging first. Reconcile production only after staging history is correct.
Never run `supabase db reset --linked`.

## Web rollback

If a web release fails:

1. Open the Expo Hosting deployment dashboard.
2. Select the last known-good deployment.
3. Promote it to production.
4. Verify the homepage and reset-password route.
5. Record the failed commit, deployment URL, and symptoms before making a fix.

Rolling back the web bundle does not roll back database migrations.

## Database recovery

Before every production migration:

1. Verify backup availability and restore instructions in Supabase.
2. Run compatibility queries for new constraints.
3. Apply one migration at a time.
4. Verify functions, policies, indexes, RLS, buckets, and critical user flows.

Prefer a forward correction for additive migrations. Use a database restore
only when the recovery point and expected data loss are understood.

## Incident notes

For an incident, record:

- start time and user-visible symptoms
- affected deployment and commit
- Supabase project ref
- relevant request IDs and sanitized errors
- mitigation and recovery time

Do not include passwords, access tokens, secret keys, or complete user records
in logs or incident notes.
