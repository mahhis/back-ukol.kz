import { Body, Controller, Ctx, Flow, Get, Post } from 'amala'
import { Context } from 'koa'
import { TOrder } from '@/helpers/types'
import { badRequest } from '@hapi/boom'
import { createOrder } from '@/models/Order'
import { sendMessage, uploadeAppointmentPhoto } from '@/handlers/bot/api'
import authorize from '@/midleware/auth'

@Controller('order')
export default class OrderController {
  @Flow([authorize])
  @Post('/uploadPhoto')
  uploadeAppointmentPhoto(@Ctx() ctx: Context) {
    console.log(123)
    // try {
    //   // Access the uploaded file
    //   const res = ctx.req.files

    //   console.log(res)

    //   if (!res) {
    //     ctx.throw(badRequest('Photo is required'))
    //   }

    //   ctx.body = {
    //     success: true,
    //     message: 'File uploaded successfully!',
    //   }
    // } catch (e) {
    //   console.error('Error while uploading photo:', e)
    //   ctx.throw(badRequest(e))
    // }
  }

  @Flow([authorize])
  @Post('/create')
  async create(@Ctx() ctx: Context, @Body({ required: true }) order: TOrder) {
    try {
      const idMessageWA = await sendMessage(order)
      order.idMessageWA = idMessageWA.idMessage
      const newOrder = await createOrder(ctx.state['user'], order)
      return {
        data: newOrder,
        success: true,
      }
    } catch (e) {
      console.error('Error while creating order:', e)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ctx.throw(badRequest(e))
    }
  }

  @Get('/check')
  check() {
    console.log('Check endpoint called')
  }
}
