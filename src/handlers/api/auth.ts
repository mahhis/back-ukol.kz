import { Body, Controller, Ctx, Flow, Get, Post } from 'amala'
import { Context } from 'koa'
import { checkCode, checkPhone, refresh } from '@/models/User'

import { OrderModel, getLastOrderByUser } from '@/models/Order'
import { TPhoneNumber, TPhoneNumberAndCode } from '@/helpers/types'
import { badRequest, unauthorized } from '@hapi/boom'
import { phoneRateLimit } from '@/helpers/phoneRateLimit'
import errorNotification from '@/helpers/errorNotification'
//import authorize from '@/midleware/auth'

@Controller('auth')
export default class AuthController {
  //@Flow([authorize])
  @Get('/refresh')
  async refresh(@Ctx() ctx: Context) {
    try {
      const refreshToken = ctx.cookies.get('refreshToken')
      const { user, accessToken } = await refresh(refreshToken!)
      ctx.cookies.set('refreshToken', user.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      })
      const currnetOrder = await getLastOrderByUser(user)
      return {
        success: true,
        user: user.strippedAndFilled({ withExtra: true }),
        accessToken: accessToken,
        currentOrder: currnetOrder?.strippedAndFilled(), // Convert result to a boolean
      }
    } catch (e) {
      console.error('Error while auth:', e)

      const errorMessage =
        `*Error in /refresh Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify(
          ctx.cookies.get('refreshToken'),
          null,
          2
        )}\`\`\``

      await errorNotification(errorMessage)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ctx.throw(badRequest(e))
    }
  }

  @Post('/code')
  async getConfirmationCode(
    @Ctx() ctx: Context,
    @Body({ required: true }) { phoneNumber, code }: TPhoneNumberAndCode
  ) {
    try {
      const { user, accessToken } = await checkCode(phoneNumber, code)
      ctx.cookies.set('refreshToken', user.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      })
      const currnetOrder = await getLastOrderByUser(user)
      return {
        success: true,
        user: user.strippedAndFilled({ withExtra: true }),
        accessToken: accessToken,
        currentOrder: currnetOrder?.strippedAndFilled, // Convert result to a boolean
      }
    } catch (e) {
      console.error('Error while auth:', e)

      const errorMessage =
        `*Error in /code Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify(
          { phoneNumber, code },
          null,
          2
        )}\`\`\``

      await errorNotification(errorMessage)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ctx.throw(unauthorized())
    }
  }
  @Flow(phoneRateLimit)
  @Post('/phone')
  async getPhoneNumber(
    @Ctx() ctx: Context,
    @Body({ required: true }) { phoneNumber }: TPhoneNumber
  ) {
    try {
      await checkPhone(phoneNumber)
      return {
        success: true,
      }
    } catch (e) {
      console.error('Error while auth:', e)

      const errorMessage =
        `*Error in /phone Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify({ phoneNumber }, null, 2)}\`\`\``

      await errorNotification(errorMessage)
      ctx.throw(badRequest())
    }
  }
}
