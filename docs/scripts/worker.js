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
        d[i-1][j] + 1,
        d[i][j-1] + 1,
        d[i-1][j-1] + substitutionCost
      )
    }
  }
  return d[m - 1][n - 1]
}

self.onmessage = (message) => {
  const [command, ...args] = message.data
  const responses = {
    "load" : onLoad,
    "query": onQuery,
  }
  responses[command](...args)
}

// load the package definitions into memory
const onLoad = async () => {
  self.packages = await fetch("../packages.json")
    .then(response => response.json())
    .then(packages => packages.map(package_ => {
      return {
        name: package_.name,
        version: package_.version,
        description: package_.description.replaceAll("\\n", "\n")
      }}))

  self.updatedAt = await fetch("../updated-at.json")
    .then(response => response.json())
    .then(obj => obj.updatedAt)

  postMessage(["timestamped", self.updatedAt])
  postMessage(["loaded"])
}

// search the loaded packages for a term
const onQuery = (term) => {
  if (term === "") {
    postMessage(["queried", []])
    return
  }

  const maxEdits = Math.max(term.length, 5)
  const results = packages
    .map(p => {
      p.difference = difference(p.name, term)
      return p
    })
    .filter(p => (p.difference <= maxEdits))
    .sort((a, b) => {
      const editDifference = a.difference - b.difference
      if (editDifference < 0) {
        return -1
      } else if (editDifference > 0) {
        return 1
      } else {
        return (parseFloat(a.version) <= parseFloat(b.version)) ? 1 : -1 
      }
    })
    .slice(0, 100)

  postMessage(["queried", results])
}
