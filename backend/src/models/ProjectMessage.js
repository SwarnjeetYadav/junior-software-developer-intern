import mongoose from 'mongoose'

const projectMessageSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
)

projectMessageSchema.index({ projectId: 1, createdAt: 1 })

export default mongoose.model('ProjectMessage', projectMessageSchema)
