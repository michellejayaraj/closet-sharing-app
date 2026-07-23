const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const test = require('node:test')

const schemaPath =
  'supabase/migrations/20260723220000_create_application_schema.sql'
const indexesPath =
  'supabase/migrations/20260723221000_add_application_indexes.sql'

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
  ].join('\n')

  assert.doesNotMatch(sql, /\bdrop\s+(table|schema|database)\b/i)
  assert.doesNotMatch(sql, /\btruncate\b/i)
})
