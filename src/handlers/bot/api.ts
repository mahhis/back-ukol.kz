import { Order } from '@/models/Order'
import { Readable } from 'stream'
import { TOrder } from '@/helpers/types'
import FormData from 'form-data' // Ensure you're importing the form-data package
import axios from 'axios'
import env from '@/helpers/env'

// Add 'http://' to the URL
const BASE_UEL_SEND_MESSAGE = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/sendMessage/${env.TOKEN}`

export const sendMessage = async (orderDetails: TOrder) => {
  try {
    const payload = {
      chatId: env.CHAT_ID_TEST,
      message: formatOrderMessage(orderDetails),
    }
    const response = await axios.post(BASE_UEL_SEND_MESSAGE, payload)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    const code = Math.floor(10000 + Math.random() * 90000).toString()
    const payload = {
      chatId: `${phoneNumber}@c.us`,
      message: `ukol.kz код: *${code}*`,
    }
    const response = await axios.post(BASE_UEL_SEND_MESSAGE, payload)
    return {
      data: response.data,
      code: code,
    }
  } catch (error) {
    console.error('Error sending verifucation code:', error)
    throw error
  }
}

function formatOrderMessage(orderDetails: TOrder): string {
  // Extracting necessary fields
  const { title, address, amount, options, arrivalTime } = orderDetails

  // Prepare options list, filtering out falsy values and formatting the output
  const optionsList = Object.entries(options)
    .filter(([, value]) => value) // Keep only options with truthy values
    .map(([key]) => {
      // Replace keys with user-friendly strings
      switch (key) {
        case 'isNeedPharmacy':
          return '• Нужно зайти в аптеку'
        case 'isHaveDoctorsAppointment':
          return '• Есть назаначение врача'
        case 'isWithDrugsCocktail':
          return '• Нужны препараты для коктейля'
        case 'isPremiumIntoxication':
          return '• Премиум интоксикация'
        case 'isWithDressingMaterial':
          return '• С перевязочным материалом'
        default:
          return ''
      }
    })
    .join('\n')

  // Determine arrival time message
  const arrivalTimeMessage =
    arrivalTime && arrivalTime.isNearestHour
      ? '*На время:* ближайшее время'
      : `*На время:* ${arrivalTime?.hours || 'N/A'} часов ${
          arrivalTime?.minutes || 'N/A'
        } минуты`

  // Construct the message
  return (
    `📢 *Заказ*\n\n` +
    `*Заголовок:* ${title || 'N/A'}\n` +
    `*Адрес:* ${address || 'N/A'}\n` +
    `*Итог к оплате:* ${amount || 0}₸\n` +
    `*Дополнительные услуги:*\n${optionsList || 'Не выбраны'}\n` +
    `${arrivalTimeMessage}\n`
  )
}

const BASE_URL_UPLOAD = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/uploadFile/${env.TOKEN}`

export const uploadeAppointmentPhoto = async (file: any) => {
  const formData = new FormData()
  if (file instanceof Readable) {
    formData.append('file', file, { filename: 'uploaded-file' }) // Provide a filename for the uploaded file
  } else {
    formData.append('file', file, {
      filename: file.originalname || 'uploaded-file',
    })
  }
  const headers = {
    'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
  }
  const response = await axios.post(BASE_URL_UPLOAD, formData, { headers })

  console.log(response)
  return response
}
