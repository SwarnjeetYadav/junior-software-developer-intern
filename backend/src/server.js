import app from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import mongoose from 'mongoose'

async function start() {
  await connectDatabase()

  const server = app.listen(env.port, () => {
    console.log(`TeamFlow API running on port ${env.port}`)
  })

  const shutdown = async (signal) => {
    console.log(`Received ${signal}; shutting down TeamFlow API`)
    server.close(async () => {
      await mongoose.disconnect()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))
}

start().catch((error) => {
  console.error('Unable to start TeamFlow API', error)
  process.exit(1)
})
