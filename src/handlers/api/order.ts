import { Body, Controller, Ctx, Flow, Get, Post } from 'amala'
import { Context } from 'koa'
import { TOrder } from '@/helpers/types'
import { badRequest } from '@hapi/boom'
import {
  createOrder,
  getOrderById,
  getOrderByUserPhoneNumberWithActiveOrder,
  removeOrder,
} from '@/models/Order'
import {
  handleCancelOrComplete,
  handleResponseOnOrder,
} from '@/helpers/answers'
import { isBefore, subMinutes } from 'date-fns'
import {
  notifyAboutCansel,
  sendConfirmationMessageToUser,
  sendMessageToSpecialists,
  uploadeAppointmentPhoto,
} from '@/handlers/bot/api'
import { scheduleOrderTimeout } from '@/helpers/schedullerAnswers'
import authorize from '@/midleware/auth'
import env from '@/helpers/env'
import errorNotification from '@/helpers/errorNotification'
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
      const response = await uploadeAppointmentPhoto(file)
      return {
        success: true,
        data: { photoURL: response.urlFile },
      }
    } catch (e) {
      console.error('Error uploading file:', e)
      const errorMessage =
        `*Error in /uploadPhoto Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n`

      await errorNotification(errorMessage)
      ctx.throw(500, 'Error uploading file')
    }
  }

  @Flow([authorize])
  @Post('/create')
  async create(@Ctx() ctx: Context, @Body({ required: true }) order: TOrder) {
    try {
      const idMessageWA = await sendMessageToSpecialists(order)
      //await sendHowToTakeOrderMessage(idMessageWA)
      await sendConfirmationMessageToUser(order, ctx.state['user'].phoneNumber)
      order.idMessageWA = idMessageWA.idMessage
      const newOrder = await createOrder(ctx.state['user'], order)
      await scheduleOrderTimeout(newOrder.id)

      return {
        data: newOrder,
        success: true,
      }
    } catch (e) {
      console.error('Error while creating order:', e)

      const errorMessage =
        `*Error in /create Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify(order, null, 2)}\`\`\``

      await errorNotification(errorMessage)

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
      const errorMessage =
        `*Error in /cancel Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify(orderID, null, 2)}\`\`\``

      await errorNotification(errorMessage)
      ctx.throw(badRequest(e))
    }
  }
  @Flow([authorize])
  @Get('/check')
  async checkOrder(@Ctx() ctx: Context) {
    const order = await getOrderByUserPhoneNumberWithActiveOrder(
      ctx.state['user'].phoneNumber
    )
    return {
      order: order,
      success: true,
    }
  }

  @Post('/reply')
  async answerOnOrder(@Body({ required: true }) data: any) {
    try {
      const { typeWebhook } = data
      if (typeWebhook == 'outgoingMessageReceived') {
        return {
          status: 200,
        }
      }

      const { senderData } = data
      const { chatId } = senderData || {}

      if (chatId.endsWith('@g.us') && chatId == env.CHAT_ID_TEST) {
        await handleResponseOnOrder(data)
      } else if (chatId.endsWith('@c.us')) {
        await handleCancelOrComplete(data)
      }

      return {
        status: 200,
      }
    } catch (e) {
      console.log('Error: ', e)

      // Send a Telegram notification
      const errorMessage =
        `*Error in /reply Endpoint*\n\n` +
        `*Message:* ${e.message}\n` +
        `*Stack:* \`${e.stack || 'N/A'}\`\n` +
        `*Payload:* \`\`\`${JSON.stringify(data, null, 2)}\`\`\``

      await errorNotification(errorMessage)

      return {
        status: 200,
      }
    }
  }
}
