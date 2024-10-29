import { Server } from 'http'
import { bootstrapControllers } from 'amala'
import { resolve } from 'path'
import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import cookie from 'koa-cookie'
import cors from '@koa/cors'
import env from '@/helpers/env'

const app = new Koa()

export default async function () {
  const router = new Router()

  app.use(
    cors({
      origin: env.DEV_URL,
      credentials: true,
    })
  )
  app.use(cookie())

  await bootstrapControllers({
    app,
    basePath: '/',
    controllers: [resolve(__dirname, '../handlers/api/*')],
    disableVersioning: true,
    router,
  })
  // const allowedOrigins = [env.DEV_URL, env.PROD_URL, 'http://localhost:5173/']

  // app.use(
  //   cors({
  //     origin: (ctx) => {
  //       const requestOrigin = ctx.request.header.origin || ''
  //       if (allowedOrigins.includes(requestOrigin)) {
  //         return requestOrigin // Return the allowed origin
  //       }
  //       return env.DEV_URL // Return the default DEV_URL if the origin is not allowed
  //     },
  //     credentials: true, // Allow credentials (cookies, etc.)
  //   })
  // )
  app.use(
    cors({
      origin: env.DEV_URL,
      credentials: true,
    })
  )
  app.use(bodyParser())
  app.use(router.routes())
  app.use(router.allowedMethods())

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
