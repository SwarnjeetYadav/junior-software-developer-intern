const clientsByProject = new Map()

export function subscribeProjectChat(projectId, response) {
  const key = String(projectId)
  if (!clientsByProject.has(key)) clientsByProject.set(key, new Set())
  const clients = clientsByProject.get(key)
  clients.add(response)
  return () => {
    clients.delete(response)
    if (!clients.size) clientsByProject.delete(key)
  }
}

export function publishProjectChatMessage(projectId, message) {
  const clients = clientsByProject.get(String(projectId))
  if (!clients?.size) return
  const payload = 'event: chat-message\ndata: ' + JSON.stringify({ projectId: String(projectId), message }) + '\n\n'
  for (const response of clients) {
    if (response.destroyed || response.writableEnded) {
      clients.delete(response)
      continue
    }
    response.write(payload)
  }
  if (!clients.size) clientsByProject.delete(String(projectId))
}
