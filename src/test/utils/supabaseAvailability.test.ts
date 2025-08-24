import { describe, it, expect, beforeEach } from 'vitest';
import { isSupabaseAvailable, resetSupabaseAvailabilityCache } from './supabaseAvailability';

describe('Supabase Availability Utility', () => {
  beforeEach(() => {
    resetSupabaseAvailabilityCache();
  });

  it('should return false when Supabase is not available', async () => {
    const isAvailable = await isSupabaseAvailable();
    expect(isAvailable).toBe(false);
  });

  it('should cache the result of availability check', async () => {
    // First call
    const result1 = await isSupabaseAvailable();
    
    // Second call should use cached result
    const result2 = await isSupabaseAvailable();
    
    expect(result1).toBe(result2);
    expect(result1).toBe(false);
  });

  it('should allow cache reset', async () => {
    // First call
    await isSupabaseAvailable();
    
    // Reset cache
    resetSupabaseAvailabilityCache();
    
    // Should work normally after reset
    const result = await isSupabaseAvailable();
    expect(result).toBe(false);
  });
});