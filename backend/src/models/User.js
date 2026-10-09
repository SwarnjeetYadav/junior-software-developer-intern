import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['ADMINISTRATOR', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
      default: 'TEAM_MEMBER',
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    preferences: {
      notifications: {
        taskAssignment: { type: Boolean, default: true },
        projectInvitation: { type: Boolean, default: true },
        chatMention: { type: Boolean, default: true },
        dependencyUnblocked: { type: Boolean, default: true },
        teamUpdates: { type: Boolean, default: true },
      },
      display: {
        compactMode: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
