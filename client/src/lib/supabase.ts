import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpvgjsuqsyrkfaghcdks.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdmdqc3Vxc3lya2ZhZ2hjZGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjAyOTAsImV4cCI6MjA4MjA5NjI5MH0.vnDN51kwUuYnLr81exXEKk7oWDkUBGY4nSoq-imuZUA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
