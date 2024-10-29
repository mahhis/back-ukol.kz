import 'module-alias/register'
import 'reflect-metadata'
import 'source-map-support/register'

import bot from '@/helpers/bot'

import server from '@/helpers/server'
import startMongo from '@/helpers/startMongo'

async function runApp() {
  console.log('Starting mongo')
  await startMongo()
  console.log('Mongo connected')

  console.log('Starting server...')
  await server()

  console.log('Starting bot...')

  // Errors
  bot.catch(console.error)
  // Start bot
  await bot.launch()
  console.info(`Bot is up and running`)
}

void runApp()
