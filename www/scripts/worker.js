// a function that returns the edit distance between two strings
// translation of https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
const difference = (s, t) => {
  const m = s.length
  const n = t.length
  const d = Array(m).fill().map(_ => Array(n).fill(0))
  for (let i = 1; i < m; i++)
    d[i][0] = i

  for (let j = 1; j < n; j++)
    d[0][j] = j


  for (let j = 1; j < n; j++) {
    for (let i = 1; i < m; i++) {
      let substitutionCost = s[i] == t[j] ? 0 : 2
      d[i][j] = Math.min(
        d[i-1][j] + 2,
        d[i][j-1] + 1,
        d[i-1][j-1] + substitutionCost
      )
    }
  }
  return d[m - 1][n - 1]
}

// the top 500 packages that match the search term
const results = (packages, query) => {
  return (new Promise((resolve, reject) => {  
    if (query === "")
      return []

    const f = curry(difference, query)
    resolve(
      packages
        .sort((a, b) => (f(a[0]) <= f(b[0])) ? -1 : 1 )
        .slice(0, 500)
    )
  }))
}

self.onmessage = (message) => {
  const [command, ...args] = message.data
  const responses = {
    "load" : onLoad,
    "query": onQuery
  }
  responses[command](...args)
}

// load the package definitions into memory
const onLoad = async () => {
  self.packages = await fetch("../packages.json")
    .then(response => response.json())

  postMessage(["loaded"])
}

// search the loaded packages for a term
const onQuery = (term) => {
  if (term === "") {
    postMessage(["queried", []])
    return
  }

  const relevance = (a, b) => { return (difference(a.name, term) <= difference(b.name, term)) ? -1 : 1 }
  const results = packages
    .sort(relevance)
    .slice(0, 100)

  postMessage(["queried", results])
}