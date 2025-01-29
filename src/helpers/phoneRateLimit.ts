import { Context, Next } from 'koa'
import { badRequest } from '@hapi/boom'

const phoneRequests = new Map<string, number>()
const COOLDOWN_MS = 30 * 1000 // 30 seconds

export async function phoneRateLimit(ctx: Context, next: Next) {
  if (ctx.path === '/auth/phone') {
    const phoneNumber = ctx.request.body?.phoneNumber
    if (!phoneNumber) {
      ctx.throw(badRequest('Phone number is required'))
      return
    }

    const lastRequestTime = phoneRequests.get(phoneNumber)
    const currentTime = Date.now()

    if (lastRequestTime && currentTime - lastRequestTime < COOLDOWN_MS) {
      ctx.throw(badRequest('Please wait 30 seconds before requesting again'))
      return
    }

    phoneRequests.set(phoneNumber, currentTime)

    // Clean up old entries every minute
    if (phoneRequests.size > 1000) {
      for (const [phone, time] of phoneRequests) {
        if (currentTime - time > COOLDOWN_MS) {
          phoneRequests.delete(phone)
        }
      }
    }
  }

  await next()
}
export function L() {
  return 0
}
