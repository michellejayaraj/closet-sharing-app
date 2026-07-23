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
