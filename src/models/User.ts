import {
  TokenType,
  generateAccessToken,
  generateRefreshToken,
  verify,
} from '@/helpers/jwt'
import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { omit } from 'lodash'
import { sendVerificationCode } from '@/handlers/bot/api'

@modelOptions({ schemaOptions: { timestamps: true } })
export class User {
  @prop({ required: true, index: true, unique: true })
  phoneNumber!: string

  @prop()
  activationCode?: string

  @prop({ index: true })
  refreshToken?: string

  strippedAndFilled(
    this: any,
    { withExtra = false }: { withExtra?: boolean; withToken?: boolean } = {}
  ) {
    const stripFields = [
      'createdAt',
      'updatedAt',
      '__v',
      'refreshToken',
      'activationCode',
    ]
    if (!withExtra) {
      stripFields.push('phoneNumber')
    }
    return omit(this.toObject(), stripFields)
  }
}

export const UserModel = getModelForClass(User)

export async function findOrCreateUser(phoneNumber: string) {
  return await UserModel.findOneAndUpdate(
    { phoneNumber },
    {},
    {
      upsert: true,
      new: true,
    }
  )
}

export async function checkPhone(phoneNumber: string) {
  const sendActivationCode = await sendVerificationCode(phoneNumber)
  const user = await findOrCreateUser(phoneNumber)
  user.activationCode = sendActivationCode.code
  await user.save()
}

export async function checkCode(phoneNumber: string, code: string) {
  const user = await findOrCreateUser(phoneNumber)

  if (user.activationCode != code) {
    throw new Error(`wrong code`)
  }
  user.refreshToken = generateRefreshToken(user.id)
  const accessToken = generateAccessToken(user.id)
  user.activationCode = ''
  await user.save()

  return {
    user,
    accessToken,
  }
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw new Error(`Have not refresh token`)
  }
  const payload = verify(refreshToken, TokenType.REFRESH)
  const user = await UserModel.findById(payload.id)

  if (!user || !user.refreshToken) {
    throw new Error(`Not auth`)
  }
  user.refreshToken = generateRefreshToken(user.id)
  const accessToken = generateAccessToken(user.id)
  await user.save()

  return {
    user,
    accessToken,
  }
}
