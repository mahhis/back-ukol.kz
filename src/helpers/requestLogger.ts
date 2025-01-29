import { Context, Next } from 'koa'
import { appendFile } from 'fs/promises'
import { resolve } from 'path'
import errorNotification from '@/helpers/errorNotification'

// Create path to logs file
const LOGS_PATH = resolve(process.cwd(), 'logs.txt')

export async function requestLogger(ctx: Context, next: Next) {
  const startTime = Date.now()

  // Format initial request data
  const requestData = {
    timestamp: new Date().toISOString(),
    method: ctx.method,
    path: ctx.path,
    ip: ctx.ip,
    userAgent: ctx.headers['user-agent'] || 'Unknown',
    requestBody: JSON.stringify(ctx.request.body || {}),
    queryParams: JSON.stringify(ctx.query || {}),
    headers: {
      ...ctx.headers,
      authorization: ctx.headers.authorization ? '[FILTERED]' : undefined,
      cookie: ctx.headers.cookie ? '[FILTERED]' : undefined,
    },
  }

  try {
    await next()

    // Format log entry for successful request
    const logEntry = `
[${requestData.timestamp}] SUCCESS
Path: ${requestData.method} ${requestData.path}
IP: ${requestData.ip}
User-Agent: ${requestData.userAgent}
Request Body: ${requestData.requestBody}
Query Params: ${requestData.queryParams}
Response Status: ${ctx.status}
Response Time: ${Date.now() - startTime}ms
----------------------------------------`

    // Write to file
    await appendFile(LOGS_PATH, logEntry + '\n')
  } catch (error) {
    // Format log entry for failed request
    const logEntry = `
[${requestData.timestamp}] ERROR
Path: ${requestData.method} ${requestData.path}
IP: ${requestData.ip}
User-Agent: ${requestData.userAgent}
Request Body: ${requestData.requestBody}
Query Params: ${requestData.queryParams}
Error: ${error.message}
Status: ${error.status || 500}
Response Time: ${Date.now() - startTime}ms
Stack: ${error.stack || 'No stack trace'}
----------------------------------------`

    // Write error to file
    await appendFile(LOGS_PATH, logEntry + '\n')

    // Send notification for critical errors
    if (error.status >= 500) {
      await errorNotification(
        `*Server Error*\n\n` +
          `*Path:* ${requestData.path}\n` +
          `*Method:* ${requestData.method}\n` +
          `*Error:* ${error.message}\n` +
          `*IP:* ${requestData.ip}\n` +
          `*Time:* ${requestData.timestamp}`
      )
    }

    throw error
  }
}

export function L() {
  return 0
}
