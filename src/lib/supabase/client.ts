// Alias untuk backward compatibility
// Komponen lama yang import dari '@/lib/supabase/client' tetap bekerja
export { createSupabaseBrowser as supabase } from './browser'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default supabase
