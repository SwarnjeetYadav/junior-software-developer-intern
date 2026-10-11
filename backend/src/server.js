import { createServer } from 'node:http'
import app from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import mongoose from 'mongoose'
import { configureChatRealtime, closeChatRealtime } from './services/chatRealtime.service.js'

async function start() {
  await connectDatabase()
  const server = createServer(app)
  configureChatRealtime(server)

  server.listen(env.port, () => {
    console.log(`Anvaya API and Socket.IO running on port ${env.port}`)
  })

  let shuttingDown = false
  const shutdown = async (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`Received ${signal}; shutting down Anvaya API`)
    const forceExit = setTimeout(() => process.exit(1), 10_000)
    forceExit.unref()
    await closeChatRealtime()
    await new Promise((resolve) => server.close(resolve))
    await mongoose.disconnect()
    clearTimeout(forceExit)
    process.exit(0)
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'))
  process.once('SIGINT', () => shutdown('SIGINT'))
}

start().catch((error) => {
  console.error('Unable to start Anvaya API', error)
  process.exit(1)
})
