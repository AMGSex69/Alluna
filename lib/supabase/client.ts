import { createClient } from "@supabase/supabase-js"

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

let supabase: any = null

if (!USE_MOCK_DATA) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (supabaseUrl && supabaseAnonKey) {
		supabase = createClient(supabaseUrl, supabaseAnonKey)
	} else {
		// When not in mock mode, enforce presence of Supabase env vars
		throw new Error(
			"Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
		)
	}
}

export { supabase }

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
