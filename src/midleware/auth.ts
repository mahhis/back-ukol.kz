import { Context, Next } from 'koa'
import { TokenType, verify } from '@/helpers/jwt'
import { User, UserModel } from '@/models/User'
import { badRequest, forbidden, notFound } from '@hapi/boom'

export default async function authorize(ctx: Context, next: Next) {
  let userToken = ctx.headers.authorization
  if (!userToken) {
    console.log('Error: Bad Request')
    return
  }
  userToken = userToken.split(' ')[1]
  if (!userToken || typeof userToken !== 'string' || userToken == 'null') {
    console.log('Error: Forbidden')
    return
  }

  let payload
  try {
    payload = verify(userToken, TokenType.ACCESS)
  } catch (err) {
    console.log('Error: Forbidden')
    return
  }

  const user = await UserModel.findById(payload.id)
  if (!user) {
    console.log('Error: User not found')
    return
  }
  ctx.state['user'] = user as User

  return next()
}
