self.onmessage = (message) => {
  const responses = { "load" : onLoad }
  responses[message.data]()
}

// load the package definitions into memory
const onLoad = async () => {
  self.packages = await fetch("packages.json")
    .then(response => response.json())

  postMessage("loaded")
}
