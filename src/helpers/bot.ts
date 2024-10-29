import WhatsAppBot from '@green-api/whatsapp-bot'
import env from '@/helpers/env'

const bot = new WhatsAppBot({
  idInstance: env.INSTANCE_ID,
  apiTokenInstance: env.TOKEN,
})

export default bot
