import { supabase } from '../supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export class DatabaseError extends Error {
  readonly code?: string;
  readonly details?: string;

  constructor(
    message: string,
    code?: string,
    details?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export function handleDatabaseError(error: PostgrestError): never {
  throw new DatabaseError(
    error.message,
    error.code,
    error.details
  );
}

export { supabase };
