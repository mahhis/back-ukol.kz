import { Ref, getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { TOrder, TUser } from '@/helpers/types' // Assuming you have a User model defined
import { User, UserModel } from '@/models/User'
import { omit, result } from 'lodash'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class Order {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>

  @prop({ required: true })
  title!: string

  @prop({ required: true })
  address!: string

  @prop({ required: true, default: 0 })
  amount!: number

  @prop()
  options?: {
    isNeedPharmacy: boolean
    isHaveDoctorsAppointment: boolean
    isWithDrugsCocktail: boolean
    isPremiumIntoxication: boolean
    isWithDressingMaterial: boolean
    isWithMaterialsPoisoning: boolean
    photo: any
    daysForNurse: number
    message: string
  }

  @prop()
  arrivalTime?: {
    hours: string
    minutes: string
    isNearestHour: boolean
    date: string | null
  }
  @prop()
  idMessageWA?: string

  @prop({ default: 'waiting' })
  status?: string

  @prop({ default: 999 })
  bestBit?: number

  @prop()
  ownerBestBit?: string

  strippedAndFilled(
    this: any,
    { withExtra = false }: { withExtra?: boolean; withToken?: boolean } = {}
  ) {
    const stripFields = [
      'updatedAt',
      'bestBit',
      'idMessageWA',
      '__v',
      'user',
      'address',
      'amount',
      'arrivalTime',
      'options',
    ]
    if (!withExtra) {
      stripFields.push('phoneNumber')
    }
    return omit(this.toObject(), stripFields)
  }
}

export const OrderModel = getModelForClass(Order)

// Update `findOrCreateOrder` function
export async function createOrder(user: TUser, orderData: TOrder) {
  // Create an order object by merging the user and orderData
  const order = {
    user: user, // Set the user reference
    title: orderData.title,
    address: orderData.address,
    amount: orderData.amount,
    options: orderData.options, // Use options from orderData
    arrivalTime: orderData.arrivalTime, // Use arrivalTime from orderData
    idMessageWA: orderData.idMessageWA, // Use idMessageWA if provided
  }

  // Create a new order in the database
  return await OrderModel.create(order)
}

export async function getOrdersByIdMessageWA(idMessageWA: string) {
  try {
    // Find all orders with the given idMessageWA
    const orders = await OrderModel.find({ idMessageWA })
      .populate('user')
      .exec()
    return orders[0]
  } catch (error) {
    console.error('Error fetching orders by idMessageWA:', error)
    throw error
  }
}
export async function getLastOrderByUser(user: TUser) {
  try {
    const lastOrder = await OrderModel.findOne({ user: user })
      .sort({ createdAt: -1 }) // Sort by `createdAt` in descending order
      .populate('user') // Populate user reference if needed
      .exec()

    return lastOrder
  } catch (error) {
    console.error('Error fetching the last order by user:', error)
    throw error
  }
}

export async function removeOrder(order: any): Promise<void> {
  try {
    order.status = 'canceled'
    await order.save()
  } catch (error) {
    console.error('Error while removing order:', error)
    throw error
  }
}
export async function getOrderById(orderID: string) {
  try {
    const order = await OrderModel.findById(orderID).populate('user').exec()
    if (!order) {
      throw new Error('Order not found')
    }
    return order as unknown as Document & { createdAt: Date } & Order
  } catch (error) {
    console.error('Error fetching order by ID:', error)
    throw error
  }
}

export async function getOrdersWithStatusTaken() {
  try {
    const orders = await OrderModel.find({ status: 'taken' })
      .populate('user')
      .exec()
    return orders
  } catch (error) {
    console.error('Error fetching orders with status "taken":', error)
    throw error
  }
}

export async function getOrderByUserPhoneNumberWithActiveOrder(
  phoneNumber: string
) {
  try {
    // Find the user with the given phone number
    const user = await UserModel.findOne({ phoneNumber }).exec()

    if (!user) {
      throw new Error(`User with phoneNumber ${phoneNumber} not found`)
    }

    // Find the order associated with the user
    const order = await OrderModel.findOne({
      user: user._id,
      status: { $in: ['taken', 'waiting'] }, // Filter for 'taken' or 'waiting'
    })
      .populate('user') // Populate user details if needed
      .exec()

    return order
  } catch (error) {
    console.error(`Error fetching order by phoneNumber ${phoneNumber}:`, error)
    throw error
  }
}
