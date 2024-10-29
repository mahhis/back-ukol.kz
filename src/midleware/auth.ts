import { Context, Next } from 'koa'
import { TokenType, verify } from '@/helpers/jwt'
import { User, UserModel } from '@/models/User'
import { badRequest, forbidden, notFound } from '@hapi/boom'

export default async function authorize(ctx: Context, next: Next) {
  let userToken = ctx.headers.authorization
  if (!userToken) {
    return ctx.throw(badRequest())
  }
  userToken = userToken.split(' ')[1]
  if (!userToken || typeof userToken !== 'string' || userToken == 'null') {
    return ctx.throw(forbidden())
  }

  let payload
  try {
    payload = verify(userToken, TokenType.ACCESS)
  } catch (err) {
    return ctx.throw(forbidden())
  }

  const user = await UserModel.findById(payload.id)
  if (!user) {
    return ctx.throw(notFound())
  }
  ctx.state['user'] = user as User

  return next()
}
