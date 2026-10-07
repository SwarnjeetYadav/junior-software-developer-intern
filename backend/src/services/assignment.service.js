import mongoose from 'mongoose'
import ProjectMember from '../models/ProjectMember.js'
import Task from '../models/Task.js'

export async function suggestAssignee(projectId) {
  if (!mongoose.isValidObjectId(projectId)) return null

  const members = await ProjectMember.find({ projectId }).select('userId').lean()
  if (!members.length) return null

  const memberIds = members.map((member) => member.userId)
  const counts = await Task.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        assigneeId: { $in: memberIds },
        status: { $ne: 'COMPLETED' },
      },
    },
    { $group: { _id: '$assigneeId', activeTaskCount: { $sum: 1 } } },
  ])

  const load = new Map(counts.map((item) => [String(item._id), item.activeTaskCount]))
  let best = memberIds[0]

  for (const candidate of memberIds) {
    const candidateLoad = load.get(String(candidate)) || 0
    const bestLoad = load.get(String(best)) || 0
    if (candidateLoad < bestLoad) best = candidate
  }

  return best
}
