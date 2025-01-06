import { Server } from 'http'
import { bootstrapControllers } from 'amala'
import { koaBody } from 'koa-body'
import { resolve } from 'path'
import Koa from 'koa'
import Router from 'koa-router'
//import bodyParser from 'koa-bodyparser'
// import {
//   getCancelMessage,
//   getCompleteOrder,
//   getResponseToOrder,
// } from '@/helpers/scheduller'
import cookie from 'koa-cookie'
import cors from '@koa/cors'
import env from '@/helpers/env'

const app = new Koa()

export default async function () {
  const router = new Router()

  const allowedOrigins = [
    env.PROD_URL,
    env.PROD_SPEC_URL,
    env.NGROK_URL,
    '46.101.109.139',
    '51.250.12.167',
    '51.250.84.44',
    '51.250.95.149',
    '89.169.137.216',
    '158.160.49.84',
    '165.22.93.202',
    '167.172.162.71',
  ]

  app.use(
    cors({
      origin: (ctx) => {
        const requestOrigin = ctx.request.header.origin || ''
        if (allowedOrigins.includes(requestOrigin)) {
          return requestOrigin
        }
        return env.PROD_URL
      },
      credentials: true,
    })
  )

  // app.use(
  //   cors({
  //     origin: env.PROD_URL,
  //     credentials: true,
  //   })
  // )
  app.use(cookie())
  app.use(koaBody())
  app.use(router.routes())
  app.use(router.allowedMethods())

  await bootstrapControllers({
    app,
    basePath: '/',
    controllers: [resolve(__dirname, '../handlers/api/*')],
    disableVersioning: true,
    router,
  })

  app.use(
    cors({
      origin: (ctx) => {
        const requestOrigin = ctx.request.header.origin || ''
        if (allowedOrigins.includes(requestOrigin)) {
          return requestOrigin
        }
        return env.PROD_URL
      },
      credentials: true,
    })
  )

  // app.use(
  //   cors({
  //     origin: env.PROD_URL,
  //     credentials: true,
  //   })
  // )

  // await getResponseToOrder()
  // await getCompleteOrder()
  // await getCancelMessage()

  return new Promise<Server>((resolve, reject) => {
    const connection = app
      .listen(env.PORT)
      .on('listening', () => {
        console.log(`HTTP is listening on ${env.PORT}`)
        resolve(connection)
      })
      .on('error', reject)
  })
}
