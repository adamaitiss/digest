const env = import.meta.env;

export const appConfig = {
  supabaseUrl: env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY as string | undefined,
  basePath: (env.VITE_BASE_PATH as string | undefined) ?? "/digest/",
  useDemoData:
    env.VITE_USE_DEMO_DATA === "true" ||
    env.MODE === "test" ||
    (env.DEV && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY))
};

export const hasSupabaseConfig = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
