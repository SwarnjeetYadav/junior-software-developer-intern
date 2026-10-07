import app from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  await connectDatabase()
  app.listen(env.port, () => {
    console.log(`TeamFlow API running on port ${env.port}`)
  })
}

start().catch((error) => {
  console.error('Unable to start TeamFlow API', error)
  process.exit(1)
})
