import { createClient } from '@supabase/supabase-js'

// 这两个值是 Supabase 专门用于浏览器和 APP 的公开客户端配置，不是管理员密钥。
// 保留环境变量覆盖，同时给本机 Android/iOS 构建提供稳定默认值。
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sxaoaoebggxxfhfngiio.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_IeK0U6d_vU3TOfi4q7OnCw_4CsG5l5n'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
