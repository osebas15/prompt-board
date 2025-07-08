import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'

// Example custom hook
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = () => setCount(prev => prev + 1)
  const decrement = () => setCount(prev => prev - 1)
  const reset = () => setCount(initialValue)
  
  return { count, increment, decrement, reset }
}

describe('Custom Hooks', () => {
  describe('useCounter', () => {
    it('initializes with default value', () => {
      const { result } = renderHook(() => useCounter())
      expect(result.current.count).toBe(0)
    })

    it('initializes with custom value', () => {
      const { result } = renderHook(() => useCounter(10))
      expect(result.current.count).toBe(10)
    })

    it('increments count', () => {
      const { result } = renderHook(() => useCounter())
      
      act(() => {
        result.current.increment()
      })
      
      expect(result.current.count).toBe(1)
    })

    it('decrements count', () => {
      const { result } = renderHook(() => useCounter(5))
      
      act(() => {
        result.current.decrement()
      })
      
      expect(result.current.count).toBe(4)
    })

    it('resets count to initial value', () => {
      const { result } = renderHook(() => useCounter(10))
      
      act(() => {
        result.current.increment()
        result.current.increment()
      })
      
      expect(result.current.count).toBe(12)
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.count).toBe(10)
    })
  })
})
