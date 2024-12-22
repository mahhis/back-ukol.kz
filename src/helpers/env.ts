import * as dotenv from 'dotenv'
import { cleanEnv, str } from 'envalid'
import { cwd } from 'process'
import { resolve } from 'path'

dotenv.config({ path: resolve(cwd(), '.env') })

// eslint-disable-next-line node/no-process-env
export default cleanEnv(process.env, {
  TOKEN: str(),
  MONGO: str(),
  INSTANCE_ID: str(),
  PORT: str(),
  CHAT_ID_TEST: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  PROD_URL: str(),
  NGROK_URL: str(),
  GOOGLE_MAP_API_KEY: str(),
  ADMIN_NUMBER: str(),
  TELEGRAM_CHAT_ID: str(),
  TELEGRAM_BOT_TOKEN: str(),
})
