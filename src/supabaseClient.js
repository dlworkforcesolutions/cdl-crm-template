import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://medkwxkiuqqgmodolka.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZGt3eGt4aXVxcWdtb2RvbGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzMxNzgsImV4cCI6MjA5Mjc0OTE3OH0.aYu6URJ9I_MuU8I-P7NhGRrHBKzPeWb1_viToS1-Gds";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
