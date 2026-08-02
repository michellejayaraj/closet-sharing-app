const assert = require('node:assert/strict')
const test = require('node:test')

const { appendUniquePage, hasNextPage } = require('../lib/pagination.cjs')

const makeItems = (start, count) =>
  Array.from({ length: count }, (_, index) => ({
    id: `item-${start + index}`,
  }))

test('closet-sized pages retain every item in a large data set', () => {
  const allItems = makeItems(0, 73)
  let loaded = []

  for (let offset = 0; offset < allItems.length; offset += 24) {
    const page = allItems.slice(offset, offset + 24)
    loaded = appendUniquePage(loaded, page)
  }

  assert.equal(loaded.length, 73)
  assert.deepEqual(loaded, allItems)
})

test('borrowed-sized pages stop after the partial final page', () => {
  const allItems = makeItems(0, 53)
  const pages = []

  for (let offset = 0; offset < allItems.length; offset += 20) {
    pages.push(allItems.slice(offset, offset + 20))
  }

  assert.equal(hasNextPage(pages[0], 20), true)
  assert.equal(hasNextPage(pages[1], 20), true)
  assert.equal(hasNextPage(pages[2], 20), false)
})

test('overlapping pages do not duplicate records', () => {
  const firstPage = makeItems(0, 24)
  const overlappingPage = [...makeItems(20, 24), { id: 'item-43' }]
  const loaded = appendUniquePage(firstPage, overlappingPage)

  assert.equal(loaded.length, 44)
  assert.equal(new Set(loaded.map((item) => item.id)).size, 44)
  assert.deepEqual(loaded.slice(-4), makeItems(40, 4))
})
