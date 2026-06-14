import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NEXT_PUBLIC_SUPABASE_URL=https://gazdlasbzfdhbqxnnwta.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6eS3XMp3o1gmWhS-z4VVOA_50r-y6hG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);