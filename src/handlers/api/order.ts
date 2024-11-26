import { Body, Controller, Ctx, Flow, Get, Post } from 'amala'
import { Context } from 'koa'
import { TOrder } from '@/helpers/types'
import { badRequest } from '@hapi/boom'
import {
  createOrder,
  getLastOrderByUser,
  getOrderById,
  removeOrder,
} from '@/models/Order'
import { isBefore, subMinutes } from 'date-fns'
import {
  notifyAboutCansel,
  sendConfirmationMessageToUser,
  sendMessageToSpecialists,
  uploadeAppointmentPhoto,
} from '@/handlers/bot/api'
import authorize from '@/midleware/auth'
import fs from 'fs'
import multer from '@koa/multer'
import path from 'path'

const upload = multer({ dest: './uploads' })
@Controller('order')
export default class OrderController {
  @Flow([authorize])
  @Flow([upload.single('file')])
  @Post('/uploadPhoto')
  async uploadeAppointmentPhoto(@Ctx() ctx: Context) {
    try {
      const file = ctx.file

      if (!file) {
        ctx.throw(400, 'No file uploaded')
      }

      // Define the path to save the file
      const uploadPath = path.join(
        __dirname,
        './../../../uploads',
        file.originalname
      )

      // Move the file to the uploads directory
      fs.rename(file.path, uploadPath, (err) => {
        if (err) {
          console.error('Error saving file:', err)
          ctx.throw(500, 'Error saving file')
        }
      })

      console.log(file)
      const response = await uploadeAppointmentPhoto(file)
      return {
        success: true,
        data: { photoURL: response.urlFile },
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      ctx.throw(500, 'Error uploading file')
    }
  }

  @Flow([authorize])
  @Post('/create')
  async create(@Ctx() ctx: Context, @Body({ required: true }) order: TOrder) {
    try {
      const idMessageWA = await sendMessageToSpecialists(order)
      await sendConfirmationMessageToUser(order, ctx.state['user'].phoneNumber)
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

  @Flow([authorize])
  @Post('/cancel')
  async cancel(
    @Ctx() ctx: Context,
    @Body({ required: true }) { orderID }: any
  ) {
    try {
      const order = await getOrderById(orderID)

      if (!order) {
        return {
          success: false,
        }
      }
      // Check if the order is older than 5 minutes
      const fiveMinutesAgo = subMinutes(new Date(), 5)
      if (isBefore(order.createdAt, fiveMinutesAgo)) {
        return {
          success: false,
        }
      }
      await removeOrder(order)
      await notifyAboutCansel(order)
      // Proceed to remove the order
      return {
        success: true,
      }
    } catch (e) {
      console.error('Error while canceling order:', e)
      ctx.throw(badRequest(e))
    }
  }

  @Get('/check')
  check() {
    console.log('Check endpoint called')
  }
}
