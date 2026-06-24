import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://soepadocivmmyufnwrot.supabase.co" //import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = "sb_publishable_PQx4X9l1YaqU9kR_Eb770w_Wfe6NZ3W" //import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);