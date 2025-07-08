import { createClient } from '@supabase/supabase-js'

// Test database configuration
export const supabaseUrl = 'http://localhost:54321'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
export const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Create test client
export const supabaseTest = createClient(supabaseUrl, supabaseAnonKey)

// Create admin client for test setup/teardown
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Test helpers
export const createTestUser = async (email: string, password: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  
  if (error) throw error
  return data.user
}

export const deleteTestUser = async (userId: string) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
}

export const cleanupTestData = async () => {
  // Clean up test data after tests
  await supabaseAdmin.from('prompts').delete().neq('id', '')
  await supabaseAdmin.from('profiles').delete().neq('id', '')
}
