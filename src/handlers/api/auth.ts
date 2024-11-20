import { Body, Controller, Ctx, Get, Post } from 'amala'
import { Context } from 'koa'
import { checkCode, checkPhone, refresh } from '@/models/User'

import { OrderModel } from '@/models/Order'
import { TPhoneNumber, TPhoneNumberAndCode } from '@/helpers/types'
import { badRequest, unauthorized } from '@hapi/boom'
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
      const hasWaitingOrder = await OrderModel.exists({
        user: user._id,
        status: 'waiting',
      })
      return {
        success: true,
        user: user.strippedAndFilled({ withExtra: true }),
        accessToken: accessToken,
        haveActualOrder: Boolean(hasWaitingOrder), // Convert result to a boolean
      }
    } catch (e) {
      console.log(e)
      ctx.throw(badRequest())
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
      const hasWaitingOrder = await OrderModel.exists({
        user: user._id,
        status: 'waiting',
      })

      return {
        success: true,
        user: user.strippedAndFilled({ withExtra: true }),
        accessToken: accessToken,
        haveActualOrder: Boolean(hasWaitingOrder), // Convert result to a boolean
      }
    } catch (e) {
      console.log(e)
      ctx.throw(unauthorized())
    }
  }

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
      console.log(e)
      ctx.throw(badRequest())
    }
  }
}
