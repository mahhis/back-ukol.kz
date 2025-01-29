import { Context, Middleware } from 'koa'
import ratelimit from 'koa-ratelimit'

const db = new Map()

export const rateLimiter: Middleware = ratelimit({
  driver: 'memory',
  db: db,
  duration: 60000,
  max: 20,
  throw: true,
  whitelist: (ctx: Context) => {
    const ip = ctx.ip
    return false
  },
  blacklist: (ctx: Context) => {
    const ip = ctx.ip
    return false
  },
})

export function L() {
  return 0
}
