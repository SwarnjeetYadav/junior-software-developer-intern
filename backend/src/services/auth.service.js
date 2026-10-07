import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { signAccessToken } from '../utils/token.js'

export async function registerUser({ name, email, password }) {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, 'Name email and password are required')
  }

  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters')

  const normalizedEmail = email.trim().toLowerCase()
  const exists = await User.findOne({ email: normalizedEmail })
  if (exists) throw new ApiError(409, 'Email is already registered')

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'TEAM_MEMBER',
  })

  return {
    token: signAccessToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  }
}

export async function loginUser({ email, password }) {
  if (!email?.trim() || !password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'Invalid email or password')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Invalid email or password')

  return {
    token: signAccessToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  }
}
