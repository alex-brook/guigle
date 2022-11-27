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
  const [command, ...args] = message.data
  const responses = {
    "loaded": onLoaded,
    "queried": onQueried
  }
  responses[command](...args)
}

const onLoaded = () => {
  const queryInput = document.querySelector("#query")
  queryInput.removeAttribute("disabled")
  queryInput.setAttribute("placeholder", "Search for a package")
  document.querySelector(".spinner").classList.add("hidden")
}

const onQueried = (packages) => {
  const template = document.querySelector("template")

  document
    .querySelectorAll("[data-result]")
    .forEach(node => node.remove())

  packages 
    .forEach(package_ => {
      const clone = template.content.cloneNode(true)
      let article = clone.querySelector("article")
      
      clone.querySelector("[data-field='name']").textContent = package_.name
      clone.querySelector("[data-field='version']").textContent = package_.version
      clone.querySelector("[data-field='description']").textContent = package_.description
      article.setAttribute("data-result", package_.name)
      template.parentElement.appendChild(clone)
    })

  document.querySelector(".spinner").classList.add("hidden")
  document.querySelector(".wip").remove()
}

window.onload = (event) => {
  const worker = new Worker("./scripts/worker.js")
  worker.onmessage = onmessage
  worker.postMessage(["load"])
  
  document
    .querySelector("#query")
    .addEventListener(
      "input",
      debounce(
        event => {
          document.querySelector(".spinner").classList.remove("hidden")
          worker.postMessage(["query", event.target.value])
        },
        250))
}
