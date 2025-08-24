/**
 * Utility functions for checking Supabase availability in tests
 */

let supabaseAvailable: boolean | null = null;

/**
 * Check if Supabase is available for integration tests
 * Caches the result to avoid multiple requests
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  // Return cached result if available
  if (supabaseAvailable !== null) {
    return supabaseAvailable;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  
  try {
    const response = await fetch(`${supabaseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    supabaseAvailable = response.ok;
    return supabaseAvailable;
  } catch (error) {
    supabaseAvailable = false;
    return false;
  }
}

/**
 * Reset the cache for Supabase availability check
 * Useful for testing or when availability might change
 */
export function resetSupabaseAvailabilityCache(): void {
  supabaseAvailable = null;
}