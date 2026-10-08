import 'dotenv/config'

const mongoUri = process.env.MONGODB_URI?.trim()
const jwtSecret = process.env.JWT_SECRET?.trim()
const nodeEnv = process.env.NODE_ENV || 'development'
const clientOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!mongoUri) throw new Error('MONGODB_URI is required in backend/.env')
if (!jwtSecret) throw new Error('JWT_SECRET is required in backend/.env')
if (nodeEnv === 'production' && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production')
}

const port = Number(process.env.PORT || 5000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port')
}

export const env = { port, nodeEnv, mongoUri, jwtSecret, clientOrigins }
