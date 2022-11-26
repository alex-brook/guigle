// trigger an event handler only after a specified period of receiving no
// further calls
const debounce = (func, ms) => {
  // tidy up the timeout id after it has been consumed
  const wrappedFunc = (event) => {
    func(event)
    event.target.removeAttribute("data-timeout")
  }

  return (event) => {
    const timeoutId = event.target.getAttribute("data-timeout")
    if (timeoutId !== null)
      clearTimeout(timeoutId)

    event.target.setAttribute("data-timeout", setTimeout(wrappedFunc, ms, event))
  }
}

// partially apply arguments to a given function
const curry = (func, ...args) => {
  return (...rest) => {
    return func(...args, ...rest)
  }
}

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

// handle the search box changing by updating the displayed results
const search = (packages, event) => {
  document
    .querySelectorAll("[data-result]")
    .forEach(node => node.remove())

  const template = document.querySelector("template")

  results(packages, event.target.value)
    .then(results => {
      results
        .forEach(([name, version, category, source]) => {
          const clone = template.content.cloneNode(true)
          let article = clone.querySelector("article")

          article.textContent = `${name} (${version})` 
          article.setAttribute("data-result", name)
          template.parentElement.appendChild(clone)
        })
    })
}

const onmessage = (message) => {
  const responses = { "loaded" : onLoaded }
  responses[message.data]()
}

const onLoaded = () => {
  const queryInput = document.querySelector("#query")
  queryInput.removeAttribute("disabled")
  queryInput.removeAttribute("placeholder")
  document.querySelector(".spinner").classList.add("hidden")
}

window.onload = (event) => {
  const worker = new Worker("worker.js")
  worker.onmessage = onmessage
  worker.postMessage("load")
}
