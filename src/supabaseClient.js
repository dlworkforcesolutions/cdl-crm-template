import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://medkwxkiuqqgmodolka.supabase.co";

const supabaseAnonKey = "sb_publishable_UYiGpPFxnNbi7vste1qR0w_7JRxvEgI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
