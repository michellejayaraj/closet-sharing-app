# Supabase development

This directory defines the local database expected by the Expo client. It was
created without connecting to or inspecting the hosted Supabase project.

## Safety status

The initial migration is a canonical schema for a **fresh local or staging
database**. It intentionally fails when the application tables already exist.
All seven migrations have been applied and verified manually in staging and
production. Their CLI migration-history rows have not been reconciled yet, so
do not run `supabase db push` against either hosted project.

Before adopting these migrations for an existing project:

1. Back up the hosted database and confirm restore procedures.
2. Check the hosted PostgreSQL major version with `show server_version;` and
   update `db.major_version` in `config.toml` if it differs.
3. Review the July 25 hosted-schema inventory and every reconciliation
   migration.
4. Back up the hosted project before changing migration history.
5. Follow `docs/operations-runbook.md` to reconcile migration history without
   executing the SQL again.

Some CLI commands default to the linked remote project. Always pass `--local`
or `--linked` explicitly and verify the target before executing a database
command. Never run `supabase db reset --linked` against production.

## Local-only verification

A Docker-compatible runtime is required by the Supabase local stack.

```bash
npx supabase start
npx supabase db reset --local
npx supabase db lint --local --level error
npm test
```

`db reset --local` destroys only the local database and then applies all
migrations and `seed.sql`.

## Migration contents

- `20260723220000_create_application_schema.sql` defines application tables,
  foreign keys, compatibility columns, timestamps, profile creation, and RLS
  enablement.
- `20260723221000_add_application_indexes.sql` defines indexes for current
  client queries and prevents concurrent active borrows of the same item.
- `20260725200000_reconcile_hosted_schema.sql` adds missing timestamps,
  backfills safe defaults, tightens columns confirmed to contain no nulls, and
  adds missing query indexes.
- `20260725201000_secure_application_access.sql` replaces legacy policies,
  restricts grants, validates borrowing, and adds atomic group creation and
  invite redemption functions.
- `20260725202000_reconcile_storage_access.sql` consolidates storage policies
  and scopes all writes to the authenticated user's folder.
- `20260725203000_add_item_availability_lookup.sql` exposes availability
  without revealing borrower identity.
- `20260725204000_create_application_storage_buckets.sql` aligns hosted image
  buckets with the local configuration.

The hosted catalog audit used aggregate counts only. Across 4 profiles, 14
closet items, 3 groups, 5 memberships, and 7 borrow records, none of the fields
tightened by the reconciliation contained null values. The audit also found no
invalid group names, invalid membership roles, multiple-owner groups,
self-borrows, or return timestamps earlier than their borrow timestamps.
