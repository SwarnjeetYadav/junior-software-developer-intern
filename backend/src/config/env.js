import 'dotenv/config'

const mongoUri = process.env.MONGODB_URI?.trim()
const jwtSecret = process.env.JWT_SECRET?.trim()

if (!mongoUri) throw new Error('MONGODB_URI is required in backend/.env')
if (!jwtSecret) throw new Error('JWT_SECRET is required in backend/.env')

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri,
  jwtSecret,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}
