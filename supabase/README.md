# Supabase development

This directory defines the local database expected by the Expo client. It was
created without connecting to or inspecting the hosted Supabase project.

## Safety status

The initial migration is a canonical schema for a **fresh local or staging
database**. It intentionally fails when the application tables already exist.
The additive reconciliation migrations were prepared from a read-only hosted
catalog audit, but have not been applied remotely. Do not run `supabase db push`
against the hosted project yet.

Before adopting these migrations for an existing project:

1. Back up the hosted database and confirm restore procedures.
2. Check the hosted PostgreSQL major version with `show server_version;` and
   update `db.major_version` in `config.toml` if it differs.
3. Review the July 25 hosted-schema inventory and every reconciliation
   migration.
4. Back up the hosted project before changing migration history.
5. Adopt the two baseline migrations in migration history without executing
   their fresh-database `CREATE TABLE` statements.
6. Test the additive migrations against a separate staging project.
7. Request separate approval before applying anything to production.

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

The hosted catalog audit used aggregate counts only. Across 4 profiles, 14
closet items, 3 groups, 5 memberships, and 7 borrow records, none of the fields
tightened by the reconciliation contained null values. The audit also found no
invalid group names, invalid membership roles, multiple-owner groups,
self-borrows, or return timestamps earlier than their borrow timestamps.
