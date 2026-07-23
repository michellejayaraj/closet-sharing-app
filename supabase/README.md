# Supabase development

This directory defines the local database expected by the Expo client. It was
created without connecting to or inspecting the hosted Supabase project.

## Safety status

The initial migration is a canonical schema for a **fresh local or staging
database**. It intentionally fails when the application tables already exist.
Do not run `supabase db push` against the hosted project yet.

Before adopting these migrations for an existing project:

1. Back up the hosted database and confirm restore procedures.
2. Check the hosted PostgreSQL major version with `show server_version;` and
   update `db.major_version` in `config.toml` if it differs.
3. Link the CLI only when remote read access is approved.
4. Pull the existing schema into a separate comparison branch:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db pull
   npx supabase db pull --schema auth
   npx supabase db pull --schema storage
   ```

5. Compare table types, foreign keys, triggers, constraints, indexes, RLS
   policies, and grants with the canonical migration.
6. Replace the canonical migration with an additive adoption migration for the
   actual hosted schema.
7. Test the complete chain against a disposable local database and staging.
8. Review the SQL before requesting separate approval for production.

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

Phase 3 must add and test RLS and Storage policies before the fresh local schema
is usable through an authenticated client.
