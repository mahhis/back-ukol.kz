import { TOrder } from '@/helpers/types'
import axios from 'axios'
import env from '@/helpers/env'
import fs from 'fs'
import path from 'path'
// Add 'http://' to the URL
const BASE_URL_SEND_MESSAGE = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/sendMessage/${env.TOKEN}`
const BASE_URL_SEND_FILE = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/sendFileByUrl/${env.TOKEN}`
const BASE_URL_LAST_INCOMING_MESSAGES = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/lastIncomingMessages/${env.TOKEN}`
const GET_MESSAGE_BY_ID = `https://7103.api.greenapi.com/waInstance${env.INSTANCE_ID}/getMessage/${env.TOKEN}`

export const fetchLastIncomingMessages = async (minutes = 5) => {
  try {
    const response = await axios.get(BASE_URL_LAST_INCOMING_MESSAGES, {
      params: { minutes },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching last incoming messages:')
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

export const sendOrderTakenToGroup = async (order: any) => {
  try {
    const payload = {
      chatId: env.CHAT_ID_TEST,
      message: `❗️Специалист для этого заказа выбран. Предложения на этот вызов больше не обрабатываются❗️`,
      quotedMessageId: order.idMessageWA,
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)

    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendSpecialistAlredyFindedMessageToUser = async (
  order: any,
  number: string
) => {
  try {
    if (order.arrivalTime.isNearestHour) {
      const userChatID = number + '@c.us'
      const arrivalTime = order.bestBit + 10
      const payload = {
        chatId: userChatID,
        message: `🚑 Специалист подтвердил ваш заказ и уже выехал! Ожидайте через ${arrivalTime} минут`,
      }

      const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)

      return response.data
    }
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendUserDataToSpecialist = async (
  IdMessageOrder: string,
  numberSpecialist: string,
  numberUser: string
) => {
  try {
    const payloadForGetMessageOrder = {
      chatId: env.CHAT_ID_TEST,
      idMessage: IdMessageOrder,
    }
    const messageOrder: any = await axios.post(
      GET_MESSAGE_BY_ID,
      payloadForGetMessageOrder
    )

    let message
    if (messageOrder.data.typeMessage == 'extendedTextMessage') {
      message = messageOrder.data.textMessage
    } else {
      message = messageOrder.data.caption
    }

    const payload = {
      chatId: numberSpecialist + '@c.us',
      message:
        `Вы были выбраны как исполнитель заказа \n\n` +
        `Номер для связи с клиентом: +${numberUser}\n` +
        `❕Пожалуйста, позвоните ему перед выездом и скажите, что вы уже выехали❕\n\n` +
        `После выполнения заказа отправьте в этот чат слово «готово», после этого в течении минуты заказ будет завершен \n\n` +
        `${message}  \n\n`,
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)

    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

export const sendUserDataToAdmin = async (
  IdMessageOrder: string,
  adminNumber: string,
  numberSpecialist: string,
  numberUser: string
) => {
  try {
    const payloadForGetMessageOrder = {
      chatId: env.CHAT_ID_TEST,
      idMessage: IdMessageOrder,
    }
    const messageOrder: any = await axios.post(
      GET_MESSAGE_BY_ID,
      payloadForGetMessageOrder
    )

    let message
    if (messageOrder.data.typeMessage == 'extendedTextMessage') {
      message = messageOrder.data.textMessage
    } else {
      message = messageOrder.data.caption
    }

    const payload = {
      chatId: adminNumber + '@c.us',
      message:
        `На заказ: \n\n` +
        `${message}  \n\n` +
        `Был выбран специалист с номером: +${numberSpecialist} \n` +
        `Номер клиента для связи : +${numberUser}`,
    }

    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)

    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// export const notifyAboutCansel = async (order: any) => {
//   try {
//     const payload = {
//       chatId: env.CHAT_ID_TEST,
//       message: 'Заказ отменен',
//       quotedMessageId: order.idMessageWA,
//     }
//     const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
//     return response.data
//   } catch (error) {
//     console.error('Error fetching last incoming messages:', error)
//     throw error
//   }
// }

export const notifyAboutCansel = async (order: any) => {
  try {
    if (order.ownerBestBit) {
      const payloadAdmin = {
        chatId: env.ADMIN_NUMBER + '@c.us',
        message: `Заказ для ${order.ownerBestBit} отменен`,
      }

      await axios.post(BASE_URL_SEND_MESSAGE, payloadAdmin)

      const payload = {
        chatId: order.ownerBestBit + '@c.us',
        message: 'Заказ отменен',
      }

      const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
      return response.data
    } else {
      const payload = {
        chatId: env.CHAT_ID_TEST,
        message: 'Заказ отменен',
        quotedMessageId: order.idMessageWA,
      }
      const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
      return response.data
    }
  } catch (error) {
    console.error('Error fetching last incoming messages:', error)
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
      : `*На дату :* ${arrivalTime?.date} \n` +
        `*На время :* ${arrivalTime?.hours || 'N/A'} часов ${
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
    (options.daysForNurse !== 0
      ? `*Количество смен для медсестры:* ${options.daysForNurse}\n`
      : '') +
    `*Комментарий к заказу:*\n ${options.message || 'Нету'}\n` +
    `${arrivalTimeMessage}`
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
      : `*На дату :* ${arrivalTime?.date} \n` +
        `*На время :* ${arrivalTime?.hours || 'N/A'} часов ${
          arrivalTime?.minutes || 'N/A'
        } минуты`

  // Construct the message
  return (
    `✅*Ваш заказ успешно получен*✅\n\n` +
    (arrivalTime.isNearestHour
      ? `Мы оповестим вас о том когда подберем вам подходящего специалиста\n\n`
      : `Специалист будет к указанному времени, ожидайте\n\n`) +
    `*Детали заказа:*\n` +
    `*Услуга:* ${title || 'N/A'}\n` +
    `*Адрес:* ${address || 'N/A'}\n` +
    `*Итог к оплате:* ${amount || 0}₸\n` +
    `*Дополнительные услуги:*\n${optionsList || 'Не выбраны'}\n` +
    `*Комментарий к заказу:*\n ${options.message || 'Нету'}\n` +
    `${arrivalTimeMessage}\n`
  )
}

export const sendMessage = async (to: string, message: string) => {
  try {
    const payload = {
      chatId: `${to}@c.us`,
      message: message,
    }
    const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
    return response.data
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// export const sendHowToTakeOrderMessage = async (quotedMessage: any) => {
//   try {

//     const message =
//       `*Инструкция как взять заказ:* \n\n` +
//       `*Что бы взять заказ смахните сообщение сверху слева направо и отправьте сообщение с количеством минут которые вам потребуются что бы взять заказ* \n\n` +
//       `или \n\n` +
//       `*Зажмите сообщение сверху до появления меню, нажмите кнопку «↰ ответить» и отправьте сообщение с количеством минут которые вам потребуются что бы взять заказ*`
//     const payload = {
//       chatId: env.CHAT_ID_TEST,
//       quotedMessageId: quotedMessage.idMessage,
//       message: message,
//     }
//     const response = await axios.post(BASE_URL_SEND_MESSAGE, payload)
//     return response.data
//   } catch (error) {
//     console.error('Error creating order:', error)
//     throw error
//   }
// }
