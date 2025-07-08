import { describe, it, expect } from 'vitest'

// Example utility function to test
function add(a: number, b: number): number {
  return a + b
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

describe('Utility Functions', () => {
  describe('add function', () => {
    it('adds two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('adds negative numbers correctly', () => {
      expect(add(-1, -2)).toBe(-3)
    })

    it('adds zero correctly', () => {
      expect(add(5, 0)).toBe(5)
    })
  })

  describe('formatDate function', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-07-08T12:00:00Z')
      expect(formatDate(date)).toBe('2025-07-08')
    })
  })
})
