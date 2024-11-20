import { Ref, getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { TOrder, TUser } from '@/helpers/types' // Assuming you have a User model defined
import { User } from '@/models/User'

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
  }
  @prop()
  idMessageWA?: string

  @prop({ default: 'waiting' })
  status?: string

  @prop({ default: 999 })
  bestBit?: number
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
