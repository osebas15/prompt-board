import { supabase } from '../supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
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
