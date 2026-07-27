import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(
  readFileSync(join(root, 'supabase/migration-history.json'), 'utf8'),
)
const migrationFiles = readdirSync(join(root, 'supabase/migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort()
const fileVersions = migrationFiles.map((name) => name.split('_')[0])

if (new Set(fileVersions).size !== fileVersions.length) {
  throw new Error('Migration versions must be unique.')
}

if (JSON.stringify(fileVersions) !== JSON.stringify(manifest.versions)) {
  throw new Error(
    'Migration files do not match supabase/migration-history.json.',
  )
}

for (const target of ['production', 'staging']) {
  if (!/^[a-z]{20}$/.test(manifest[target]?.projectRef ?? '')) {
    throw new Error(`Invalid ${target} Supabase project reference.`)
  }
}

console.log(`Verified ${migrationFiles.length} migration files and targets.`)
