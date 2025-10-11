// @/server/db/mongodb.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  return mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  })
}
