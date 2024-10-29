import { sign, verify as verifyBase } from 'jsonwebtoken'
import env from '@/helpers/env'

interface UserPayload {
  id: string
}

export const TokenType = {
  REFRESH: 'REFRESH',
  ACCESS: 'ACCESS',
}

export function generateAccessToken(payload: UserPayload) {
  const accessToken: string = sign({ id: payload }, env.JWT_ACCESS_SECRET, {
    expiresIn: '2h',
  })
  return accessToken
}
export function generateRefreshToken(payload: UserPayload) {
  const refreshToken: string = sign({ id: payload }, env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  })
  return refreshToken
}

export function verify(token: string, TokenType: string) {
  if (TokenType == 'REFRESH') {
    return verifyBase(token, env.JWT_REFRESH_SECRET) as UserPayload
  } else {
    return verifyBase(token, env.JWT_ACCESS_SECRET) as UserPayload
  }
}
