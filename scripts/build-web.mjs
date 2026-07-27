import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const environments = JSON.parse(
  readFileSync(join(root, 'config/environments.json'), 'utf8'),
)
const target = process.argv[2]
const shouldDeploy = process.argv.includes('--deploy')

const parseEnvFile = (path) => {
  if (!existsSync(path)) return {}

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return values
      const separator = trimmed.indexOf('=')
      if (separator < 1) return values
      values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1)
      return values
    }, {})
}

const fileEnv = parseEnvFile(join(root, '.env.local'))
const buildEnv = { ...fileEnv, ...process.env }
const supabaseUrl = buildEnv.EXPO_PUBLIC_SUPABASE_URL
const publishableKey = buildEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  )
}

if (publishableKey.startsWith('sb_secret_')) {
  throw new Error('A Supabase secret key cannot be embedded in a web build.')
}

let actualProjectRef
try {
  const hostname = new URL(supabaseUrl).hostname
  if (!hostname.endsWith('.supabase.co')) {
    throw new Error('Unexpected Supabase hostname.')
  }
  actualProjectRef = hostname.split('.')[0]
} catch {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL must be a valid Supabase URL.')
}

const jwtParts = publishableKey.split('.')
if (jwtParts.length === 3) {
  try {
    const payload = JSON.parse(
      Buffer.from(jwtParts[1], 'base64url').toString('utf8'),
    )
    if (payload.role && payload.role !== 'anon') {
      throw new Error(
        `A Supabase ${payload.role} key cannot be embedded in a web build.`,
      )
    }
  } catch (error) {
    if (error.message.includes('cannot be embedded')) throw error
    throw new Error('The Supabase JWT publishable key is malformed.')
  }
}

let expectedProjectRef
if (target === 'ci') {
  expectedProjectRef = process.env.EXPECTED_SUPABASE_PROJECT_REF
} else {
  expectedProjectRef = environments[target]?.supabaseProjectRef
}

if (!expectedProjectRef) {
  throw new Error('Build target must be production, staging, or ci.')
}

if (actualProjectRef !== expectedProjectRef) {
  throw new Error(
    `Refusing ${target} build: expected Supabase project ${expectedProjectRef}, received ${actualProjectRef}.`,
  )
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    env: buildEnv,
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npx', ['expo', 'export', '--platform', 'web', '--clear'])

const bundleDirectory = join(root, 'dist/_expo/static/js/web')
const bundleNames = readdirSync(bundleDirectory).filter((name) =>
  name.endsWith('.js'),
)

if (bundleNames.length !== 1) {
  throw new Error(`Expected one web bundle, found ${bundleNames.length}.`)
}

const bundle = readFileSync(join(bundleDirectory, bundleNames[0]), 'utf8')
if (!bundle.includes(expectedProjectRef)) {
  throw new Error(
    'Built bundle does not contain the expected Supabase project.',
  )
}

for (const [name, environment] of Object.entries(environments)) {
  if (name !== target && bundle.includes(environment.supabaseProjectRef)) {
    throw new Error(`Built bundle unexpectedly contains the ${name} project.`)
  }
}

console.log(`Verified ${target} web bundle for ${expectedProjectRef}.`)

if (shouldDeploy) {
  if (target !== 'production') {
    throw new Error('Only a verified production build can be deployed.')
  }
  run('npx', ['eas-cli@latest', 'deploy', '--prod', '--non-interactive'])
}
