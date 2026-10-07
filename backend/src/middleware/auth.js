import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required')

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new ApiError(401, 'Invalid or expired access token')
  }

  const user = await User.findById(payload.sub).lean()
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'User account is not active')

  req.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }

  next()
})

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission for this action'))
    next()
  }
}
