function appendUniquePage(previous, nextPage) {
  const existingIds = new Set(previous.map((item) => item.id))
  const uniqueNextPage = nextPage.filter((item) => {
    if (existingIds.has(item.id)) return false
    existingIds.add(item.id)
    return true
  })

  return [...previous, ...uniqueNextPage]
}

function hasNextPage(page, pageSize) {
  return page.length === pageSize
}

module.exports = { appendUniquePage, hasNextPage }
