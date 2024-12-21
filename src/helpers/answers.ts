import { User } from '@/models/User'
import {
  getOrdersByIdMessageWA,
  getOrdersWithStatusTaken,
} from '@/models/Order'
import {
  sendMessage,
  sendOrderTakenToGroup,
  sendSpecialistAlredyFindedMessageToUser,
} from '@/handlers/bot/api'
import { sendUserDataToAdmin } from '@/handlers/bot/api'
import { sendUserDataToSpecialist } from '@/handlers/bot/api'
import env from '@/helpers/env'
import { activeOrderTimeouts } from './schedullerAnswers'

export const handleResponseOnOrder = async (data: any) => {
  const order = await getOrdersByIdMessageWA(
    data.messageData.extendedTextMessageData.stanzaId
  )
  if (!order) {
    return
  }

  const isOrderOlderThan2Minutes =
    order.createdAt.getTime() < Date.now() - 2 * 60 * 1000

  if (!order.arrivalTime?.isNearestHour) {
    order.ownerBestBit = data.senderData.sender.slice(0, -5)
    const user = order.user as User
    await sendOrderTakenToGroup(order)
    await sendUserDataToSpecialist(
      order.idMessageWA!,
      order.ownerBestBit!,
      user.phoneNumber
    )
    await sendUserDataToAdmin(
      order.idMessageWA!,
      env.ADMIN_NUMBER,
      order.ownerBestBit!,
      user.phoneNumber
    )
    order.status = 'taken'
    await order.save()
    activeOrderTimeouts.delete(order.id)
    return
  }
  const incomingBit = Number(data.messageData.extendedTextMessageData.text)
  if (isNaN(incomingBit)) {
    console.log('isNaN')
    return
  }
  if (isOrderOlderThan2Minutes) {
    order.ownerBestBit = data.senderData.sender.slice(0, -5)
    order.bestBit = incomingBit
    const user = order.user as User
    await sendOrderTakenToGroup(order)
    await sendSpecialistAlredyFindedMessageToUser(order, user.phoneNumber)
    await sendUserDataToSpecialist(
      order.idMessageWA!,
      order.ownerBestBit!,
      user.phoneNumber
    )
    await sendUserDataToAdmin(
      order.idMessageWA!,
      env.ADMIN_NUMBER,
      order.ownerBestBit!,
      user.phoneNumber
    )
    order.status = 'taken'
    await order.save()
    activeOrderTimeouts.delete(order.id)
    return
  } else {
    const bit = incomingBit
    const ownerBit = data.senderData.sender.slice(0, -5)
    if (bit < order.bestBit!) {
      order.bestBit = bit
      order.ownerBestBit = ownerBit
      await order.save()
    }
  }
}

export const handleCancelOrComplete = async (data: any) => {
  if (data.messageData.extendedTextMessageData == undefined){
    return
  }
  const messageInc = data.messageData.extendedTextMessageData.text
  if (messageInc.toLowerCase().trim() === 'готово') {
    const takenOrders = await getOrdersWithStatusTaken()
    const order = takenOrders.find(
      (order) => order.ownerBestBit === data.senderData.chatId.slice(0, -5)
    )
    if (order) {
      // Update the status of the order
      order.status = 'complete'
      await order.save()

      const user = order.user as User

      await sendMessage(
        order.ownerBestBit!,
        `Ваш заказ успешно завершен. Спасибо за вашу работу!`
      ) // to specialist

      await sendMessage(
        user.phoneNumber!,
        `Ваш заказ завершен. Расскажите, пожалуйста, все ли вас устроило?`
      ) // to user

      await sendMessage(
        env.ADMIN_NUMBER,
        `Заказ взятый специалистом +${order.ownerBestBit} для клиента  +${user.phoneNumber} выполнен`
      ) // to admin
    } else {
      console.error(`No matching order found for completing`)
    }
  }
}
