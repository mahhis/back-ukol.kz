import { TOrder } from '@/helpers/types'
import axios from 'axios'
import env from '@/helpers/env'
import fs from 'fs'
import path from 'path'
// Add 'http://' to the URL
const BASE_URL_SEND_MESSAGE = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/sendMessage/${env.TOKEN}`
const BASE_URL_SEND_FILE = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/sendFileByUrl/${env.TOKEN}`
const BASE_URL_LAST_INCOMING_MESSAGES = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/lastIncomingMessages/${env.TOKEN}`

export const fetchLastIncomingMessages = async (minutes = 5) => {
  try {
    const response = await axios.get(BASE_URL_LAST_INCOMING_MESSAGES, {
      params: { minutes },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching last incoming messages:', error)
    throw error
  }
}

export const sendMessageToSpecialists = async (orderDetails: TOrder) => {
  try {
    const payload = {
      chatId: env.CHAT_ID_TEST,
      message: formatOrderMessage(orderDetails),
    }

    // Check if photoURL exists in orderDetails
    if (orderDetails.options.photoURL) {
      const filePayload = {
        chatId: env.CHAT_ID_TEST,
        urlFile: orderDetails.options.photoURL,
        fileName: 'Назначение', // You can customize this as needed
        caption: formatOrderMessage(orderDetails), // You can customize this as needed
      }
      const response = await axios.post(BASE_URL_SEND_FILE, filePayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.data
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendSpecialistAlredyFindedMessageToUser = async (
  time: number,
  number: string
) => {
  try {
    console.log(333)
    const userChatID = number + '@c.us'
    const arrivalTime = time + 10
    const payload = {
      chatId: userChatID,
      message: `Специалист найден! Он будет у вас через ${arrivalTime} минут`,
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
    console.log(111)
    console.log(response)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendConfirmationMessageToUser = async (
  orderDetails: TOrder,
  number: string
) => {
  try {
    const userChatID = number + '@c.us'
    const payload = {
      chatId: userChatID,
      message: formatConfirmationMessage(orderDetails),
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
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
    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
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
          return '• Есть назначение врача'
        case 'isWithDrugsCocktail':
          return '• Нужны препараты для коктейля'
        case 'isPremiumIntoxication':
          return '• Премиум интоксикация'
        case 'isWithDressingMaterial':
          return '• С перевязочным материалом'
        case 'isWithMaterialsPoisoning':
          return '• С препаратами'
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
  const LINK_TO_YANDEX_MAP = `https://yandex.ru/maps/?ll=${orderDetails.lng},${orderDetails.lat}&z=18&l=map&pt=${orderDetails.lng},${orderDetails.lat}`
  return (
    `📢 *Заказ*\n\n` +
    `*Услуга:* ${title || 'N/A'}\n` +
    `*Адрес:* ${address || 'N/A'}\n` +
    `*Яндекс Карты:* ${LINK_TO_YANDEX_MAP}\n` +
    `*Итог к оплате:* ${amount || 0}₸\n` +
    `*Дополнительные услуги:*\n${optionsList || 'Не выбраны'}\n` +
    `${arrivalTimeMessage}\n`
  )
}

const BASE_URL_UPLOAD = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/uploadFile/${env.TOKEN}`

export const uploadeAppointmentPhoto = async (file: any) => {
  const filePath = path.join(__dirname, './../../../uploads', file.originalname) // Adjust the path as necessary
  const fileBuffer = fs.readFileSync(filePath) // Read the file into a buffer

  try {
    const response = await axios.post(BASE_URL_UPLOAD, fileBuffer, {
      headers: {
        'Content-Type': file.mimetype, // Set the correct content type
      },
    })

    console.log(response.data)
    return response.data
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

function formatConfirmationMessage(orderDetails: TOrder): string {
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
          return '• Есть назначение врача'
        case 'isWithDrugsCocktail':
          return '• Нужны препараты для коктейля'
        case 'isPremiumIntoxication':
          return '• Премиум интоксикация'
        case 'isWithDressingMaterial':
          return '• С перевязочным материалом'
        case 'isWithMaterialsPoisoning':
          return '• С препаратами'
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
    `✅*Ваш заказ успешно получен*✅\n\n` +
    `Мы оповестим вас о том когда подберем вам подходящую медсетсру и через сколько она приедет\n\n` +
    `*Детали заказа:*\n` +
    `*Услуга:* ${title || 'N/A'}\n` +
    `*Адрес:* ${address || 'N/A'}\n` +
    `*Итог к оплате:* ${amount || 0}₸\n` +
    `*Дополнительные услуги:*\n${optionsList || 'Не выбраны'}\n` +
    `${arrivalTimeMessage}\n`
  )
}
