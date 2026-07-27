const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const test = require('node:test')

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

test('package scripts expose the Phase 1 verification commands', async () => {
  const packageJson = await readJson('package.json')
  const expectedScripts = [
    'build:web',
    'build:web:ci',
    'build:web:production',
    'deploy:web:production',
    'doctor',
    'format:check',
    'lint',
    'test',
    'verify',
    'verify:ci',
    'verify:migrations',
  ]

  for (const script of expectedScripts) {
    assert.equal(
      typeof packageJson.scripts[script],
      'string',
      `missing npm script: ${script}`,
    )
  }
})

test('CI verifies pull requests without write permissions', async () => {
  const workflow = await readFile('.github/workflows/verify.yml', 'utf8')

  assert.match(workflow, /pull_request:/)
  assert.match(workflow, /contents: read/)
  assert.match(workflow, /npm ci/)
  assert.match(workflow, /npm run verify:ci/)
  assert.doesNotMatch(workflow, /contents: write/)
})

test('production web builds are cache-cleared and target-checked', async () => {
  const [packageJson, buildScript, environments] = await Promise.all([
    readJson('package.json'),
    readFile('scripts/build-web.mjs', 'utf8'),
    readJson('config/environments.json'),
  ])

  assert.match(packageJson.scripts['build:web'], /--clear/)
  assert.match(
    packageJson.scripts['deploy:web:production'],
    /build-web\.mjs production --deploy/,
  )
  assert.match(buildScript, /Refusing \$\{target\} build/)
  assert.match(buildScript, /sb_secret_/)
  assert.match(buildScript, /payload\.role !== ['"]anon['"]/)
  assert.match(buildScript, /\.supabase\.co/)
  assert.match(buildScript, /unexpectedly contains the \$\{name\} project/)
  assert.equal(environments.production.supabaseProjectRef.length, 20)
  assert.equal(environments.staging.supabaseProjectRef.length, 20)
})

test('Expo configuration references repository assets', async () => {
  const appJson = await readJson('app.json')
  const { expo } = appJson

  assert.equal(expo.slug, 'closet')
  assert.equal(expo.scheme, 'clueless-closet')
  assert.match(expo.icon, /^\.\/assets\//)
  assert.match(expo.splash.image, /^\.\/assets\//)
  assert.match(expo.android.adaptiveIcon.foregroundImage, /^\.\/assets\//)
  assert.match(expo.web.favicon, /^\.\/assets\//)
})

test('the app entry point is registered with Expo', async () => {
  const packageJson = await readJson('package.json')
  const entrySource = await readFile(packageJson.main, 'utf8')

  assert.match(entrySource, /registerRootComponent\(App\)/)
})

test('password recovery is preserved before the temporary session signs in', async () => {
  const [entrySource, authSource] = await Promise.all([
    readFile('index.js', 'utf8'),
    readFile('pages/Auth.js', 'utf8'),
  ])

  assert.match(entrySource, /onRecoveryStart=\{handlePasswordRecovery\}/)
  assert.doesNotMatch(
    entrySource,
    /event === ['"]USER_UPDATED['"][\s\S]*setPasswordRecovery\(false\)/,
  )
  assert.match(
    authSource,
    /if \(isRecovery\) \{[\s\S]*onRecoveryStart\?\.\(\)[\s\S]*\}[\s\S]*supabase\.auth\.setSession/,
  )
})

test('password reset success is visible inside the web form', async () => {
  const authSource = await readFile('pages/Auth.js', 'utf8')

  assert.match(
    authSource,
    /setSuccessMessage\(['"]Check your email for the reset link!['"]\)/,
  )
  assert.match(
    authSource,
    /\{successMessage \? \([\s\S]*styles\.successMessage/,
  )
  assert.doesNotMatch(
    authSource,
    /Alert\.alert\(['"]Success['"], ['"]Check your email for the reset link!['"]\)/,
  )
})

test('Supabase configuration comes from validated public environment variables', async () => {
  const [supabaseSource, envExample] = await Promise.all([
    readFile('lib/supabase.js', 'utf8'),
    readFile('.env.example', 'utf8'),
  ])

  assert.match(supabaseSource, /process\.env\.EXPO_PUBLIC_SUPABASE_URL/)
  assert.match(supabaseSource, /process\.env\.EXPO_PUBLIC_SUPABASE_ANON_KEY/)
  assert.match(supabaseSource, /if \(!SUPABASE_URL \|\| !SUPABASE_ANON_KEY\)/)
  assert.doesNotMatch(supabaseSource, /https:\/\/[a-z]+\.supabase\.co/)
  assert.doesNotMatch(supabaseSource, /eyJ[A-Za-z0-9_-]+\./)

  assert.match(envExample, /^EXPO_PUBLIC_SUPABASE_URL=/m)
  assert.match(envExample, /^EXPO_PUBLIC_SUPABASE_ANON_KEY=/m)
})
