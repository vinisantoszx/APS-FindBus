import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function assertSupabaseConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) {
    throw new Error(
      'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local e reinicie o servidor local.',
    );
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:') {
      throw new Error('A URL precisa começar com https://');
    }
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL inválida. Use a Project URL do Supabase, no formato https://seu-projeto.supabase.co.',
    );
  }
}

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assertSupabaseConfig(supabaseUrl, supabaseKey);

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return browserClient;
};
