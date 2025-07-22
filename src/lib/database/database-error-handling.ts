/**
 * Database Error Handling
 * Centralized error handling for database operations
 */
import type { PostgrestError } from '@supabase/supabase-js'

export class DatabaseError extends Error {
  readonly code?: string
  readonly details?: string
  readonly hint?: string

  constructor(
    message: string,
    code?: string,
    details?: string,
    hint?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.details = details
    this.hint = hint
  }

  static fromPostgrestError(error: PostgrestError): DatabaseError {
    return new DatabaseError(
      error.message,
      error.code,
      error.details,
      error.hint
    )
  }

  static fromUnknownError(error: unknown): DatabaseError {
    if (error instanceof Error) {
      return new DatabaseError(error.message)
    }
    
    return new DatabaseError('An unknown error occurred')
  }

  getUserFriendlyMessage(): string {
    // Convert technical errors to user-friendly messages
    if (this.code === '23505') {
      return 'This item already exists. Please choose a different name.'
    }
    
    if (this.code === '23503') {
      return 'This operation is not allowed because it would break data relationships.'
    }
    
    if (this.code === '23514') {
      return 'The data provided does not meet the required constraints.'
    }
    
    if (this.message.includes('null value')) {
      return 'Please fill in all required fields.'
    }
    
    if (this.message.includes('invalid input value')) {
      return 'One or more values are invalid. Please check your input.'
    }
    
    if (this.message.includes('fetch') || this.message.includes('network')) {
      return 'Connection error. Please check your internet connection and try again.'
    }
    
    // Default to the original message for debugging
    return this.message
  }
}

export function handleDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    throw DatabaseError.fromPostgrestError(error as PostgrestError)
  }
  
  throw DatabaseError.fromUnknownError(error)
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError
}
