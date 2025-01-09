import { OrderModel } from '@/models/Order'
import { addHours, addMinutes, isAfter } from 'date-fns'

export const checkOrdersStatus = async () => {
  try {
    // Get all orders with 'taken' status
    const orders = await OrderModel.find({ status: 'taken' })

    for (const order of orders) {
      let deadlineTime: Date

      if (order.arrivalTime?.isNearestHour) {
        // For immediate orders: createdAt + bestBit minutes + 3 hours
        deadlineTime = addHours(
          addMinutes(order.createdAt, order.bestBit || 0),
          3
        )
      } else {
        // For scheduled orders: scheduled time + 3 hours
        const scheduledDate = new Date(order.arrivalTime?.date || '')
        scheduledDate.setHours(
          parseInt(order.arrivalTime?.hours || '0'),
          parseInt(order.arrivalTime?.minutes || '0')
        )
        deadlineTime = addHours(scheduledDate, 3)
      }

      // Check if current time is after deadline
      if (isAfter(new Date(), deadlineTime)) {
        order.status = 'waiting_rating'
        await order.save()
      }
    }
  } catch (error) {
    console.error('Error checking orders status:', error)
  }
}

export const startOrderStatusTracker = () => {
  setInterval(checkOrdersStatus, 5 * 60 * 1000)
}
