import axios from 'axios'
import env from '@/helpers/env'

export default async function (message: string) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN // Add your bot token to env
    const chatId = env.TELEGRAM_CHAT_ID // Add your Telegram chat ID to env
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    })
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
  }
}
