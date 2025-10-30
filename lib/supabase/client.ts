import { createClient } from "@supabase/supabase-js"
import { type User as SupabaseUser } from '@supabase/supabase-js'
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// Создаем клиент Supabase
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

// Auth types
// export type User = SupabaseUser & {
//   id: string;
//   email: string;
//   created_at: string;
// };

export type User = SupabaseUser;

export type AuthResponse = {
  user: User | null;
  error: Error | null;
};