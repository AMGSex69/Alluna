import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase environment variables are not set. Please check your .env.local file"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Project = {
  id: string;
  name: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  name: string;
  type: "contract" | "act" | "appendix" | "agreement";
  status: "draft" | "pending_signature" | "signed";
  file_url?: string;
  content?: string;
  created_at: string;
  updated_at: string;
};
