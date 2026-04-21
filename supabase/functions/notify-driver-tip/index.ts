import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
  try {
    const { driver_id, tip_amount, ride_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get driver info
    const { data: driver } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', driver_id)
      .single()

    // Mock SMS notification
    console.log(`SMS to ${driver?.phone}: Anda menerima tip Rp ${tip_amount.toLocaleString()} untuk perjalanan ${ride_id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
