import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow',
  jwtSecret: process.env.JWT_SECRET || 'development_only_change_me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}
