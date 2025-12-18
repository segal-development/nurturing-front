/**
 * Unit tests for usePagination hook
 * 
 * Coverage: 100% of all functions
 * - currentPage state
 * - goToNextPage
 * - goToPreviousPage  
 * - goToPage
 * - resetPage
 * - isFirstPage
 * - isLastPage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  describe('Initial State', () => {
    it('should start at page 1 by default', () => {
      const { result } = renderHook(() => usePagination())
      
      expect(result.current.currentPage).toBe(1)
    })

    it('should start at custom initial page when provided', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      expect(result.current.currentPage).toBe(5)
    })

    it('should have isFirstPage true when on page 1', () => {
      const { result } = renderHook(() => usePagination())
      
      expect(result.current.isFirstPage).toBe(true)
    })

    it('should have isFirstPage false when not on page 1', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 3 }))
      
      expect(result.current.isFirstPage).toBe(false)
    })
  })

  describe('goToNextPage', () => {
    it('should increment page by 1', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToNextPage(10)
      })
      
      expect(result.current.currentPage).toBe(2)
    })

    it('should not exceed total pages', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      act(() => {
        result.current.goToNextPage(5) // Already at last page
      })
      
      expect(result.current.currentPage).toBe(5)
    })

    it('should do nothing when totalPages is 0', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToNextPage(0)
      })
      
      expect(result.current.currentPage).toBe(1)
    })

    it('should do nothing when totalPages is negative', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToNextPage(-5)
      })
      
      expect(result.current.currentPage).toBe(1)
    })

    it('should allow navigating through multiple pages', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToNextPage(10)
      })
      act(() => {
        result.current.goToNextPage(10)
      })
      act(() => {
        result.current.goToNextPage(10)
      })
      
      expect(result.current.currentPage).toBe(4)
    })
  })

  describe('goToPreviousPage', () => {
    it('should decrement page by 1', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      act(() => {
        result.current.goToPreviousPage()
      })
      
      expect(result.current.currentPage).toBe(4)
    })

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPreviousPage()
      })
      
      expect(result.current.currentPage).toBe(1)
    })

    it('should allow navigating backwards through multiple pages', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 10 }))
      
      act(() => {
        result.current.goToPreviousPage()
      })
      act(() => {
        result.current.goToPreviousPage()
      })
      act(() => {
        result.current.goToPreviousPage()
      })
      
      expect(result.current.currentPage).toBe(7)
    })
  })

  describe('goToPage', () => {
    it('should navigate to specific page', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPage(7)
      })
      
      expect(result.current.currentPage).toBe(7)
    })

    it('should not accept page less than 1', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      act(() => {
        result.current.goToPage(0)
      })
      
      expect(result.current.currentPage).toBe(5) // Should not change
    })

    it('should not accept negative pages', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      act(() => {
        result.current.goToPage(-3)
      })
      
      expect(result.current.currentPage).toBe(5) // Should not change
    })

    it('should allow jumping to any positive page', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPage(100)
      })
      
      expect(result.current.currentPage).toBe(100)
    })
  })

  describe('resetPage', () => {
    it('should reset to initial page (default: 1)', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPage(10)
      })
      
      act(() => {
        result.current.resetPage()
      })
      
      expect(result.current.currentPage).toBe(1)
    })

    it('should reset to custom initial page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      act(() => {
        result.current.goToPage(20)
      })
      
      act(() => {
        result.current.resetPage()
      })
      
      expect(result.current.currentPage).toBe(5)
    })
  })

  describe('isLastPage', () => {
    it('should return true when on last page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 10 }))
      
      expect(result.current.isLastPage(10)).toBe(true)
    })

    it('should return false when not on last page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }))
      
      expect(result.current.isLastPage(10)).toBe(false)
    })

    it('should return true when current page exceeds total pages', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 15 }))
      
      expect(result.current.isLastPage(10)).toBe(true)
    })

    it('should return true when total pages is 1 and on page 1', () => {
      const { result } = renderHook(() => usePagination())
      
      expect(result.current.isLastPage(1)).toBe(true)
    })
  })

  describe('Combined Navigation', () => {
    it('should handle forward and backward navigation', () => {
      const { result } = renderHook(() => usePagination())
      
      // Go forward
      act(() => {
        result.current.goToNextPage(10)
      })
      act(() => {
        result.current.goToNextPage(10)
      })
      expect(result.current.currentPage).toBe(3)
      
      // Go back
      act(() => {
        result.current.goToPreviousPage()
      })
      expect(result.current.currentPage).toBe(2)
      
      // Jump to page
      act(() => {
        result.current.goToPage(8)
      })
      expect(result.current.currentPage).toBe(8)
      
      // Reset
      act(() => {
        result.current.resetPage()
      })
      expect(result.current.currentPage).toBe(1)
    })

    it('should update isFirstPage correctly during navigation', () => {
      const { result } = renderHook(() => usePagination())
      
      expect(result.current.isFirstPage).toBe(true)
      
      act(() => {
        result.current.goToNextPage(10)
      })
      expect(result.current.isFirstPage).toBe(false)
      
      act(() => {
        result.current.goToPreviousPage()
      })
      expect(result.current.isFirstPage).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid navigation without issues', () => {
      const { result } = renderHook(() => usePagination())
      
      // Rapid forward navigation
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.goToNextPage(100)
        })
      }
      expect(result.current.currentPage).toBe(51)
      
      // Rapid backward navigation
      for (let i = 0; i < 30; i++) {
        act(() => {
          result.current.goToPreviousPage()
        })
      }
      expect(result.current.currentPage).toBe(21)
    })

    it('should handle very large page numbers', () => {
      const { result } = renderHook(() => usePagination())
      
      act(() => {
        result.current.goToPage(999999)
      })
      
      expect(result.current.currentPage).toBe(999999)
      expect(result.current.isLastPage(1000000)).toBe(false)
      expect(result.current.isLastPage(999999)).toBe(true)
    })
  })
})
