import { Order, getOrdersByIdMessageWA } from '@/models/Order'
import { User } from '@/models/User'
import {
  fetchLastIncomingMessages,
  sendSpecialistAlredyFindedMessageToUser,
} from '@/handlers/bot/api'
import { isValidObjectId } from 'mongoose'
import env from '@/helpers/env'

export const logIncomingMessages = async () => {
  try {
    const messages = await fetchLastIncomingMessages(5)
    const filteredMessages = messages.filter(
      (message: { chatId: string; extendedTextMessage?: any }) =>
        message.chatId === env.CHAT_ID_TEST &&
        message.extendedTextMessage && // Check if extendedTextMessage exists
        message.extendedTextMessage.stanzaId // Check if stanzaId exists
    )

    console.log('Filtered Messages:', filteredMessages)

    await yourFunctionToCall(filteredMessages)
  } catch (error) {
    console.error('Error while fetching messages:', error)
  }
}

async function yourFunctionToCall(array: any[]) {
  const res: Order[] = []
  const uniqueOrderIds = new Set<string>()

  for (const message of array) {
    try {
      // Fetch the single order associated with the stanzaId
      const order = await getOrdersByIdMessageWA(
        message.extendedTextMessage.stanzaId
      )
      if (order.status != 'waiting') {
        continue
      }

      if (!order) {
        console.log(
          `No order found for stanzaId: ${message.extendedTextMessage.stanzaId}`
        )
        continue
      }

      console.log(333)
      console.log(order)

      // Update bestBit if the incoming value is smaller
      const incomingBit = Number(message.extendedTextMessage.text)
      if (incomingBit < (order.bestBit ?? 999)) {
        order.bestBit = incomingBit
        await order.save()
        console.log(
          `Updated bestBit for order ${order.idMessageWA} to ${incomingBit}`
        )
      } else {
        console.log(
          `Incoming bit (${incomingBit}) is not better than current bestBit (${order.bestBit})`
        )
      }

      // Add to the result array if not already added
      if (!uniqueOrderIds.has(order.idMessageWA!)) {
        uniqueOrderIds.add(order.idMessageWA!)
        res.push(order)
      }
      order.status = 'taked'
      await order.save()

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

    console.log(99)

    const res = await sendSpecialistAlredyFindedMessageToUser(
      order.bestBit!,
      user.phoneNumber
    )
    console.log(88)
    console.log(res)
  })

  console.log('Unique processed orders:', res)
  return res
}

// Call the method every 1 minute (60000 milliseconds)
setInterval(logIncomingMessages, 60000)

export const bla = () => {
  console.log('blabla')
}
bla()
// Initial call to avoid waiting 1 minute for the first fetch
