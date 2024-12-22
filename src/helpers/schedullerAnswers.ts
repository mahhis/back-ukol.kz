// scheduller.ts
import { User } from '@/models/User'
import { getOrderById } from '@/models/Order'
import {
  sendOrderTakenToGroup,
  sendSpecialistAlredyFindedMessageToUser,
  sendUserDataToAdmin,
  sendUserDataToSpecialist,
} from '@/handlers/bot/api'
import env from '@/helpers/env'

// Map to track order-specific timeouts
export const activeOrderTimeouts = new Map<string, NodeJS.Timeout>()

// Function to schedule a timeout for an order
export const scheduleOrderTimeout = async (orderID: string) => {
  const timeout = setTimeout(async () => {
    try {
      const order = await getOrderById(orderID)
      if (!order) {
        console.error(`Order not found: ${orderID}`)
        return
      }
      if (order.status != 'waiting') {
        console.error(`Order taken: ${orderID}`)
        return
      }

      if (order.ownerBestBit) {
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
        activeOrderTimeouts.delete(orderID)
      }
    } catch (error) {
      console.error(`Error handling timeout for order ${orderID}:`, error)
    }
  }, 130000)

  activeOrderTimeouts.set(orderID, timeout)
}
