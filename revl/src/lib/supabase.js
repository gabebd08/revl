import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nyqgrrecakhwygnpkdes.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cWdycmVjYWtod3lnbnBrZGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzE3NDEsImV4cCI6MjA5NDQ0Nzc0MX0.U9Z8W66Sr4lGG_hhwU3VGEJFdyxnXBKKB07GDZTYMQI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
