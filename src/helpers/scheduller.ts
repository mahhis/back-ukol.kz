import {
  Order,
  getOrderByUserPhoneNumberWithActiveOrder,
  getOrdersByIdMessageWA,
  getOrdersWithStatusTaken,
} from '@/models/Order'
import { User } from '@/models/User'
import {
  fetchLastIncomingMessages,
  sendMessage,
  sendOrderTakenToGroup,
  sendSpecialistAlredyFindedMessageToUser,
  sendUserDataToAdmin,
  sendUserDataToSpecialist,
} from '@/handlers/bot/api'
import env from '@/helpers/env'

let lastIncomingMessages: any[] = []

const getLastIncomingMessages = async () => {
  lastIncomingMessages = await fetchLastIncomingMessages(3)
}

setInterval(getLastIncomingMessages, 20000)

export const getResponseToOrder = async () => {
  try {
    //const messages = await fetchLastIncomingMessages(3)
    await handleResponseOnOrder(lastIncomingMessages)
  } catch (error) {
    console.error('Error while fetching messages:', error)
  }
}
// Call the method every 1 minute (60000 milliseconds)
setInterval(getResponseToOrder, 120000)

export const getCompleteOrder = async () => {
  try {
    // const messages = await fetchLastIncomingMessages(3)
    await handleCompleteOrder(lastIncomingMessages)
  } catch (error) {
    console.error('Error while fetching messages:', error)
  }
}
setInterval(getCompleteOrder, 20000)

export const getCancelMessage = async () => {
  try {
    //const messages = await fetchLastIncomingMessages(3)
    await handleCancelOrder(lastIncomingMessages)
  } catch (error) {
    console.error('Error while fetching messages:', error)
  }
}
setInterval(getCancelMessage, 20000)

async function handleCancelOrder(messages: any[]) {
  try {
    const adminMessages = messages.filter(
      (message: { senderId: string }) =>
        message.senderId.slice(0, -5) === env.ADMIN_NUMBER // Replace with the correct field if needed
    )

    if (adminMessages.length === 0) {
      console.log('No messages from admin.')
      return
    }

    for (const message of adminMessages) {
      if (
        typeof message.textMessage === 'string' &&
        message.textMessage.toLowerCase().startsWith('отмена')
      ) {
        const parts = message.textMessage.trim().split(/\s+/)
        const phoneNumber = parts[1]

        if (!phoneNumber) {
          console.log('No phone number provided for cancellation.')
          continue
        }
        const order = await getOrderByUserPhoneNumberWithActiveOrder(
          phoneNumber
        )

        if (!order) {
          console.error(`No order found for phone number: ${phoneNumber}`)
          continue
        }

        order.status = 'canceled'
        await order.save()

        const user = order.user as User

        await sendMessage(order.ownerBestBit!, `Заказ отменен`) // to specialist

        await sendMessage(user.phoneNumber!, `Ваш заказ отменен`) // to user

        await sendMessage(
          env.ADMIN_NUMBER,
          `Заказ взятый специалистом +${order.ownerBestBit} для клиента  +${user.phoneNumber} отменен`
        ) // to admin
      }
    }
  } catch (error) {
    console.error('Error while handling cancel messages:', error)
  }
}

async function handleCompleteOrder(messages: any[]) {
  const takenOrders = await getOrdersWithStatusTaken()

  const ownerBestBits = takenOrders.map((order) => order.ownerBestBit)

  const messagesWithMatchingChatId = messages.filter(
    (message: { chatId: string }) => {
      const trimmedChatId = message.chatId.slice(0, -5) // Remove last 5 characters
      return ownerBestBits.includes(trimmedChatId)
    }
  )

  for (const message of messagesWithMatchingChatId) {
    try {
      if (
        typeof message.textMessage === 'string' &&
        message.textMessage.toLowerCase().trim() === 'готово'
      ) {
        // Find the order associated with this message's chatId
        const order = takenOrders.find(
          (order) => order.ownerBestBit === message.chatId.slice(0, -5)
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
          console.error(
            `No matching order found for message chatId: ${message.chatId}`
          )
        }
      }
    } catch (error) {
      console.error(
        `Error processing message for chatId: ${message.chatId}`,
        error
      )
    }
  }
}

async function handleResponseOnOrder(messages: any[]) {
  const responseToOrderMessages = messages.filter(
    (message: { chatId: string; extendedTextMessage?: any }) =>
      message.chatId === env.CHAT_ID_TEST &&
      message.extendedTextMessage && // Check if extendedTextMessage exists
      message.extendedTextMessage.stanzaId // Check if stanzaId exists
  )
  const res: Order[] = []
  const uniqueOrderIds = new Set<string>()

  for (const message of responseToOrderMessages) {
    try {
      // Fetch the single order associated with the stanzaId
      const order = await getOrdersByIdMessageWA(
        message.extendedTextMessage.stanzaId
      )

      if (!order) {
        console.log(
          `No order found for stanzaId: ${message.extendedTextMessage.stanzaId}`
        )
        continue
      }

      if (order.status != 'waiting') {
        continue
      }

      // Update bestBit if the incoming value is smaller
      const incomingBit = Number(message.extendedTextMessage.text)

      if (!isNaN(incomingBit) && order.arrivalTime?.isNearestHour) {

        if (incomingBit < (order.bestBit ?? 999)) {
          order.bestBit = incomingBit
          order.ownerBestBit = message.senderId.slice(0, -5) // '12345678@c.us' -> '12345678'
          console.log(
            `Updated bestBit for order ${order.idMessageWA} to ${incomingBit}`
          )
        } else  {
          console.log(
            `Incoming bit (${incomingBit}) is not better than current bestBit (${order.bestBit})`
          )
        }

        // Add to the result array if not already added
        if (!uniqueOrderIds.has(order.idMessageWA!)) {
          uniqueOrderIds.add(order.idMessageWA!)
          res.push(order)
        }
        order.status = 'taken'
        await order.save()
      } else if (!order.arrivalTime?.isNearestHour) {
        const matchingMessages = responseToOrderMessages.filter(
          (msg) => msg.extendedTextMessage.stanzaId === order.idMessageWA
        )

        // Find the earliest message among the matching messages
        const earliestMessage = matchingMessages.reduce((earliest, current) => {
          const currentTimestamp = new Date(current.timestamp).getTime() // Adjust this based on your timestamp property
          const earliestTimestamp = new Date(earliest.timestamp).getTime() // Adjust this based on your timestamp property
          return currentTimestamp < earliestTimestamp ? current : earliest
        })

        if (!uniqueOrderIds.has(order.idMessageWA!)) {
          uniqueOrderIds.add(order.idMessageWA!)
          res.push(order)
        }
        order.ownerBestBit = message.senderId.slice(0, -5)
        order.status = 'taken'
        await order.save()

        console.log('Earliest message:', earliestMessage)
      }
    } catch (error) {
      console.error(
        `Error processing message ${message.extendedTextMessage.stanzaId}:`,
        error
      )
    }
  }

  res.forEach(async (order) => {
    // Ensure user is populated
    const user = order.user as User // Safely cast if we know user is populated
    if (!user.phoneNumber) {
      console.error(
        `User does not have a phoneNumber for order ${order.idMessageWA}`
      )
      return
    }
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
  })

  console.log('Unique processed orders:', res)
  return res
}
