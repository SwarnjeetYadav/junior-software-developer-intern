import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({
  origin: env.clientOrigin,
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'teamflow-api',
      status: 'healthy',
      environment: env.nodeEnv,
    },
  })
})

app.use('/api/v1', routes)
app.use(notFound)
app.use(errorHandler)

export default app
