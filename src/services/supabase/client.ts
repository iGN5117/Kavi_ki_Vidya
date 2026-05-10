import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl?.trim() && supabasePublishableKey?.trim());
}

export function getSupabaseConfigStatus() {
  return {
    isConfigured: hasSupabaseConfig(),
    hasUrl: Boolean(supabaseUrl?.trim()),
    hasPublishableKey: Boolean(supabasePublishableKey?.trim()),
  };
}

export const supabase = hasSupabaseConfig()
  ? createSupabaseClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : undefined;
