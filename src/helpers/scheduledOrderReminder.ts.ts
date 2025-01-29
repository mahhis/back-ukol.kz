import { OrderModel } from '@/models/Order'
import { isAfter, isBefore, subHours } from 'date-fns'
import { sendMessage } from '@/handlers/bot/api'

export const checkScheduledOrders = async () => {
  try {
    // Get all orders with 'taken' status and not immediate orders
    const orders = await OrderModel.find({
      status: 'taken',
      'arrivalTime.isNearestHour': false,
    })

    const now = new Date()

    for (const order of orders) {
      if (!order.ownerBestBit) continue

      // Create scheduled date from order
      const scheduledDate = new Date(order.arrivalTime?.date || '')
      scheduledDate.setHours(
        parseInt(order.arrivalTime?.hours || '0'),
        parseInt(order.arrivalTime?.minutes || '0')
      )

      // Calculate reminder time (1 hour before scheduled time)
      const reminderTime = subHours(scheduledDate, 1)

      // Check if current time is between reminder time and scheduled time
      // and notification hasn't been sent yet
      if (
        isAfter(now, reminderTime) &&
        isBefore(now, scheduledDate) &&
        !order.reminderSent
      ) {
        // Send reminder message
        await sendMessage(
          order.ownerBestBit,
          `⚠️ Напоминание: через час у вас заказ по адресу ${order.address}. Пожалуйста, убедитесь, что вы будете вовремя.`
        )

        // Mark reminder as sent
        order.reminderSent = true
        await order.save()
      }
    }
  } catch (error) {
    console.error('Error checking scheduled orders:', error)
  }
}

export const startScheduledOrderReminder = () => {
  // Check every 5 minutes
  setInterval(checkScheduledOrders, 5 * 60 * 1000)
}
