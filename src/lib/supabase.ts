import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://minqoqarzgkmynxbwpjc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbnFvcWFyemdrbXlueGJ3cGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTk4OTcsImV4cCI6MjA2OTk5NTg5N30.-s0F6wcOVJs7_RDnELm7WFjQqbPQSy34nXGf34SgWUM'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Document {
  id: string
  title: string
  content: string
  file_path?: string
  file_type: string
  upload_date: string
  embedding?: number[]
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  sources?: any[]
  created_at: string
}