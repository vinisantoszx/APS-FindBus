import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

type SupabaseConfig = {
  url: string;
  key: string;
};

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  return { url, key };
}

export const createClient = () => {
  const { url, key } = getSupabaseConfig();

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
};
