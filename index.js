const fp = require("fastify-plugin")
const pathToRegexp = require("path-to-regexp")

const routes = new Map()

function reverse(name, args, opts) {
  const toPath = routes.get(name)

  if (!toPath) {
    throw new Error(`Route with name ${name} is not registered`)
  }

  return toPath(args, opts)
}

function getReverseRoutesObject() {
  const routesObject = [...routes.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .reduce((result, [key, toPath]) => {
      return { ...result, [key]: toPath() }
    }, {})
  return routesObject
}

function plugin(fastify, _, next) {
  fastify.decorate("reverse", reverse)

  fastify.addHook("onRoute", (routeOptions) => {
    if (!routeOptions.name) return

    const routeName = routeOptions.name
    const routePath = pathToRegexp.compile(routeOptions.url)

    if (
      routes.has(routeName) &&
      routes.get(routeName).source !== routePath.source
    ) {
      throw new Error(`Route with name ${routeName} already registered`)
    }

    routes.set(routeName, routePath)
  })

  next()
}

module.exports = reverse
module.exports.routes = routes
module.exports.getReverseRoutesObject = getReverseRoutesObject
module.exports.plugin = fp(plugin, {
  fastify: ">= 1.6.0",
  name: "reverse",
})
