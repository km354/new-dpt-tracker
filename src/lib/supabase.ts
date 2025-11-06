import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check for missing environment variables
let configError: string | null = null
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  
  configError = `Missing required environment variables: ${missing.join(', ')}. Please configure these in your Vercel project settings under Settings → Environment Variables.`
  
  // Log to console for debugging
  console.error('❌ Configuration Error:', configError)
}

// Export error state for UI to check
export { configError }

// Create Supabase client - use placeholder if config is missing
export const supabase = configError
  ? ({
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: { message: configError } } as any),
        getUser: () => Promise.resolve({ data: { user: null }, error: { message: configError } } as any),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({ 
        select: () => ({ 
          eq: () => ({ data: null, error: { message: configError } }),
          in: () => ({ data: null, error: { message: configError } }),
          order: () => ({ data: null, error: { message: configError } }),
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: configError } }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: configError } }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: { message: configError } }) }),
      }),
    } as any)
  : createClient(supabaseUrl!, supabaseAnonKey!)

