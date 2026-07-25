const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const test = require('node:test')

const schemaPath =
  'supabase/migrations/20260723220000_create_application_schema.sql'
const indexesPath =
  'supabase/migrations/20260723221000_add_application_indexes.sql'
const reconciliationPath =
  'supabase/migrations/20260725200000_reconcile_hosted_schema.sql'
const accessPath =
  'supabase/migrations/20260725201000_secure_application_access.sql'
const storagePath =
  'supabase/migrations/20260725202000_reconcile_storage_access.sql'

test('canonical migration defines every application table', async () => {
  const schema = await readFile(schemaPath, 'utf8')
  const tables = [
    'profiles',
    'closet_items',
    'groups',
    'group_members',
    'borrowed_items',
  ]

  for (const table of tables) {
    assert.match(
      schema,
      new RegExp(`create table public\\.${table}\\s*\\(`, 'i'),
      `missing canonical table: ${table}`,
    )
    assert.match(
      schema,
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        'i',
      ),
      `RLS is not enabled for: ${table}`,
    )
  }
})

test('schema contains the PostgREST relationships used by the client', async () => {
  const schema = await readFile(schemaPath, 'utf8')

  assert.match(
    schema,
    /group_id uuid not null references public\.groups \(id\)/i,
  )
  assert.match(
    schema,
    /user_id uuid not null references public\.profiles \(id\)/i,
  )
  assert.match(
    schema,
    /closet_item_id uuid not null references public\.closet_items \(id\)/i,
  )
})

test('indexes cover current query patterns and active-borrow concurrency', async () => {
  const indexes = await readFile(indexesPath, 'utf8')
  const expectedIndexes = [
    'closet_items_user_created_at_idx',
    'group_members_user_id_idx',
    'borrowed_items_borrower_returned_at_idx',
    'borrowed_items_owner_returned_at_idx',
    'borrowed_items_group_returned_at_idx',
    'borrowed_items_one_active_borrower_idx',
  ]

  for (const index of expectedIndexes) {
    assert.match(indexes, new RegExp(index, 'i'), `missing index: ${index}`)
  }

  assert.match(
    indexes,
    /unique index borrowed_items_one_active_borrower_idx[\s\S]*where returned_at is null/i,
  )
})

test('migrations avoid destructive reset and drop statements', async () => {
  const sql = [
    await readFile(schemaPath, 'utf8'),
    await readFile(indexesPath, 'utf8'),
    await readFile(reconciliationPath, 'utf8'),
    await readFile(accessPath, 'utf8'),
    await readFile(storagePath, 'utf8'),
  ].join('\n')

  assert.doesNotMatch(sql, /\bdrop\s+(table|schema|database)\b/i)
  assert.doesNotMatch(sql, /\btruncate\b/i)
})

test('hosted reconciliation adds timestamps and tightens nullable fields', async () => {
  const reconciliation = await readFile(reconciliationPath, 'utf8')

  for (const table of ['profiles', 'closet_items', 'groups']) {
    assert.match(
      reconciliation,
      new RegExp(
        `alter table public\\.${table}[\\s\\S]*add column if not exists updated_at`,
        'i',
      ),
      `missing updated_at reconciliation for ${table}`,
    )
  }

  for (const column of [
    'image_url',
    'created_by',
    'invite_code',
    'group_id',
    'user_id',
    'borrower_id',
    'owner_id',
    'closet_item_id',
  ]) {
    assert.match(
      reconciliation,
      new RegExp(`alter column ${column} set not null`, 'i'),
      `missing not-null reconciliation for ${column}`,
    )
  }
})

test('application access uses transactional group RPCs and explicit policies', async () => {
  const access = await readFile(accessPath, 'utf8')

  assert.match(
    access,
    /function public\.create_group\(group_name_input text\)/i,
  )
  assert.match(
    access,
    /function public\.join_group_by_invite_code\([\s\S]*invite_code_input text/i,
  )
  assert.match(access, /create policy profiles_read_authenticated/i)
  assert.match(access, /create policy groups_read_members/i)
  assert.match(access, /create policy groups_update_owners/i)
  assert.match(access, /create policy borrowed_items_read_group_members/i)
  assert.doesNotMatch(access, /Anyone can look up a group by invite code/i)
})

test('storage writes are authenticated and scoped to the user folder', async () => {
  const storage = await readFile(storagePath, 'utf8')

  assert.match(storage, /create policy users_insert_own_application_images/i)
  assert.match(storage, /to authenticated/i)
  assert.match(
    storage,
    /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/i,
  )
})
