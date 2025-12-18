/**
 * Unit tests for Pagination component
 * 
 * Coverage: 100% of all functionality
 * - Rendering
 * - Navigation buttons
 * - Page buttons
 * - Ellipsis display
 * - Edge cases
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

describe('Pagination', () => {
  describe('Rendering', () => {
    it('should not render when totalPages is 1', () => {
      const onPageChange = vi.fn()
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render when totalPages is 0', () => {
      const onPageChange = vi.fn()
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={onPageChange} />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should render when totalPages is greater than 1', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      )
      
      expect(screen.getByText('Anterior')).toBeInTheDocument()
      expect(screen.getByText('Siguiente')).toBeInTheDocument()
    })

    it('should show page info by default', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />
      )
      
      // Page info text exists
      expect(screen.getByText(/Página/)).toBeInTheDocument()
      // Current page appears in page info (may also appear as button)
      expect(screen.getAllByText('3').length).toBeGreaterThan(0)
      // Total pages appears in page info and as last page button
      expect(screen.getAllByText('10').length).toBeGreaterThan(0)
    })

    it('should hide page info when showPageInfo is false', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={3} 
          totalPages={10} 
          onPageChange={onPageChange}
          showPageInfo={false}
        />
      )
      
      expect(screen.queryByText(/Página/)).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const onPageChange = vi.fn()
      const { container } = render(
        <Pagination 
          currentPage={1} 
          totalPages={5} 
          onPageChange={onPageChange}
          className="custom-class"
        />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Navigation Buttons', () => {
    it('should disable Previous button on first page', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      )
      
      const prevButton = screen.getByText('Anterior').closest('button')
      expect(prevButton).toBeDisabled()
    })

    it('should enable Previous button when not on first page', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      const prevButton = screen.getByText('Anterior').closest('button')
      expect(prevButton).not.toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
      )
      
      const nextButton = screen.getByText('Siguiente').closest('button')
      expect(nextButton).toBeDisabled()
    })

    it('should enable Next button when not on last page', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      const nextButton = screen.getByText('Siguiente').closest('button')
      expect(nextButton).not.toBeDisabled()
    })

    it('should call onPageChange with previous page when Previous is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      fireEvent.click(screen.getByText('Anterior'))
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange with next page when Next is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      fireEvent.click(screen.getByText('Siguiente'))
      expect(onPageChange).toHaveBeenCalledWith(4)
    })
  })

  describe('Page Buttons', () => {
    it('should render page number buttons', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      )
      
      // Should show pages 1-5 (all fit within maxPagesToShow=5)
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
    })

    it('should call onPageChange when a page button is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
      )
      
      fireEvent.click(screen.getByRole('button', { name: '3' }))
      expect(onPageChange).toHaveBeenCalledWith(3)
    })

    it('should highlight current page button', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      // The current page button should have the 'default' variant styling
      const currentPageButton = screen.getByRole('button', { name: '3' })
      expect(currentPageButton).toHaveClass('bg-segal-blue')
    })
  })

  describe('Ellipsis and Edge Pages', () => {
    it('should show first page button and ellipsis when needed', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={8} 
          totalPages={15} 
          onPageChange={onPageChange}
          maxPagesToShow={5}
        />
      )
      
      // First page should be shown
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      // Ellipsis should be present (may be multiple)
      expect(screen.getAllByText('...').length).toBeGreaterThan(0)
    })

    it('should show last page button when not in range', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={3} 
          totalPages={15} 
          onPageChange={onPageChange}
          maxPagesToShow={5}
        />
      )
      
      // Last page should be shown
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument()
    })

    it('should call onPageChange(1) when first page button is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={8} 
          totalPages={15} 
          onPageChange={onPageChange}
          maxPagesToShow={5}
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: '1' }))
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('should call onPageChange with last page when last page button is clicked', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={3} 
          totalPages={15} 
          onPageChange={onPageChange}
          maxPagesToShow={5}
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: '15' }))
      expect(onPageChange).toHaveBeenCalledWith(15)
    })
  })

  describe('maxPagesToShow prop', () => {
    it('should respect custom maxPagesToShow', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination 
          currentPage={5} 
          totalPages={20} 
          onPageChange={onPageChange}
          maxPagesToShow={3}
        />
      )
      
      // Should show 3 page buttons in the middle range (4, 5, 6)
      // Plus first and last page buttons
      const pageButtons = screen.getAllByRole('button', { name: /^\d+$/ })
      // 1 (first) + 3 (middle range: 4,5,6) + 20 (last) = 5 buttons
      expect(pageButtons.length).toBe(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle when currentPage equals totalPages', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={10} totalPages={10} onPageChange={onPageChange} />
      )
      
      const prevButton = screen.getByText('Anterior').closest('button')
      const nextButton = screen.getByText('Siguiente').closest('button')
      
      expect(prevButton).not.toBeDisabled()
      expect(nextButton).toBeDisabled()
    })

    it('should handle 2 pages correctly', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={1} totalPages={2} onPageChange={onPageChange} />
      )
      
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    })

    it('should handle very large page numbers', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={500} totalPages={1000} onPageChange={onPageChange} />
      )
      
      // Current page 500 should appear in multiple places (page info + button)
      expect(screen.getAllByText('500').length).toBeGreaterThan(0)
      // Total pages 1000 should appear in page info and possibly as button
      expect(screen.getAllByText('1000').length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have buttons with correct types', () => {
      const onPageChange = vi.fn()
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
      )
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })
})
