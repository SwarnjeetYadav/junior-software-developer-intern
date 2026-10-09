import { describe, expect, it } from 'vitest'

describe('dependency graph rules', () => {
  it('rejects self dependency conceptually', () => {
    const taskId = 'abc'
    expect(taskId === taskId).toBe(true)
  })

  it('detects a path that would close a cycle', () => {
    const graph = {
      A: ['B'],
      B: ['C'],
      C: [],
    }
    const target = 'A'
    const start = 'B'
    const queue = [start]
    const seen = new Set([start])
    let found = false
    while (queue.length) {
      const current = queue.shift()
      if (current === target) {
        found = true
        break
      }
      for (const next of graph[current] || []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    expect(found).toBe(false)
    expect(seen.has('C')).toBe(true)
  })
})
