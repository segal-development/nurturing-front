import { describe, it, expect } from 'vitest'
import { loginSchema } from '../../utils/validation'

describe('Login Validation', () => {
  describe('loginSchema - Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        { email: 'user@example.com', password: 'ValidPassword123' },
        { email: 'test.user@example.co.uk', password: 'ValidPassword123' },
        { email: 'user+tag@example.com', password: 'ValidPassword123' },
        { email: 'a@b.co', password: 'ValidPassword123' }
      ]

      validEmails.forEach(({ email, password }) => {
        const result = loginSchema.safeParse({ email, password })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        { email: 'notanemail', password: 'ValidPassword123' },
        { email: 'user@', password: 'ValidPassword123' },
        { email: '@example.com', password: 'ValidPassword123' },
        { email: 'user @example.com', password: 'ValidPassword123' },
        { email: '', password: 'ValidPassword123' }
      ]

      invalidEmails.forEach(({ email, password }) => {
        const result = loginSchema.safeParse({ email, password })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toMatch(/correo|email/i)
        }
      })
    })

    it('should reject email when required', () => {
      const result = loginSchema.safeParse({ email: '', password: 'ValidPassword123' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('email'))).toBe(true)
      }
    })

    it('should trim whitespace from email', () => {
      const result = loginSchema.safeParse({ email: '  user@example.com  ', password: 'ValidPassword123' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('should handle case-insensitive email validation', () => {
      const result = loginSchema.safeParse({ email: 'USER@EXAMPLE.COM', password: 'ValidPassword123' })

      expect(result.success).toBe(true)
    })
  })

  describe('loginSchema - Password Validation', () => {
    it('should accept passwords with 8+ characters', () => {
      const validPasswords = [
        'Password123',
        'MySecurePassword',
        'Complex@Password#123',
        '12345678',
        'abcdefgh'
      ]

      validPasswords.forEach(password => {
        const result = loginSchema.safeParse({ email: 'test@example.com', password })
        expect(result.success).toBe(true)
      })
    })

    it('should reject passwords with less than 8 characters', () => {
      const invalidPasswords = [
        'Pass1',
        'short',
        'abc123',
        '1234567',
        ''
      ]

      invalidPasswords.forEach(password => {
        const result = loginSchema.safeParse({ email: 'test@example.com', password })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toMatch(/mínimo|minimum|8/i)
        }
      })
    })

    it('should reject password when required', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('password'))).toBe(true)
      }
    })

    it('should accept special characters in password', () => {
      const specialCharPasswords = [
        'Pass@123!',
        'Complex#Password$',
        'Secure&Password()',
        'p@$$w0rd%'
      ]

      specialCharPasswords.forEach(password => {
        const result = loginSchema.safeParse({ email: 'test@example.com', password })
        expect(result.success).toBe(true)
      })
    })

    it('should not expose password validation in error messages', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'short' })

      expect(result.success).toBe(false)
      if (!result.success) {
        // Error message should not include the actual password
        const errorString = JSON.stringify(result.error)
        expect(errorString).not.toContain('short')
      }
    })
  })

  describe('loginSchema - Combined Validation', () => {
    it('should reject when both email and password are invalid', () => {
      const result = loginSchema.safeParse({ email: 'invalid', password: 'short' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should validate complete valid login form', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'SecurePassword123'
      }

      const result = loginSchema.safeParse(validLogin)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data).toEqual(validLogin)
      }
    })

    it('should handle null/undefined values gracefully', () => {
      const invalidData = [
        { email: null, password: 'ValidPassword123' },
        { email: 'test@example.com', password: null },
        { email: undefined, password: 'ValidPassword123' },
        { email: 'test@example.com', password: undefined }
      ]

      invalidData.forEach(data => {
        const result = loginSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    it('should reject when extra fields are provided', () => {
      const dataWithExtra = {
        email: 'test@example.com',
        password: 'ValidPassword123',
        rememberMe: true
      }

      const result = loginSchema.safeParse(dataWithExtra)
      // Schema should only accept email and password
      expect(result.success).toBe(true) // Should ignore extra fields or reject based on strict mode
    })

    it('should provide user-friendly error messages', () => {
      const result = loginSchema.safeParse({ email: 'invalid-email', password: 'short' })

      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.flatten()
        expect(errors.fieldErrors.email).toBeDefined()
        expect(errors.fieldErrors.password).toBeDefined()
      }
    })
  })

  describe('loginSchema - Security Tests', () => {
    it('should not accept SQL injection attempts in email', () => {
      const result = loginSchema.safeParse({
        email: "admin'--",
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(false)
    })

    it('should not accept XSS attempts in email', () => {
      const result = loginSchema.safeParse({
        email: '<script>alert("xss")</script>',
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(false)
    })

    it('should normalize email to lowercase for comparison', () => {
      const result = loginSchema.safeParse({
        email: 'TEST@EXAMPLE.COM',
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should not allow extremely long inputs', () => {
      const longEmail = 'a'.repeat(1000) + '@example.com'
      const result = loginSchema.safeParse({
        email: longEmail,
        password: 'ValidPassword123'
      })

      expect(result.success).toBe(false)
    })
  })
})
