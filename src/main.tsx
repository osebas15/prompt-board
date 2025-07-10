import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Debug environment loading at startup
console.log('🚀 App Starting - Environment Check:')
console.log('Mode:', import.meta.env.MODE)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
