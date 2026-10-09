import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETED'], default: 'TODO', index: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    dueDate: { type: Date, default: null, index: true },
    estimateMinutes: { type: Number, min: 5, max: 43200, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
)

taskSchema.index({ projectId: 1, assigneeId: 1, status: 1 })

export default mongoose.model('Task', taskSchema)
