const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const test = require('node:test')

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

test('package scripts expose the Phase 1 verification commands', async () => {
  const packageJson = await readJson('package.json')
  const expectedScripts = [
    'build:web',
    'doctor',
    'format:check',
    'lint',
    'test',
    'verify',
  ]

  for (const script of expectedScripts) {
    assert.equal(
      typeof packageJson.scripts[script],
      'string',
      `missing npm script: ${script}`,
    )
  }
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
