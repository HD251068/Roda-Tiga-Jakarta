import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
  try {
    const { ride_id, amount, passenger_name } = await req.json()

    // Mock Midtrans API call
    const mockResponse = {
      token: `mock-token-${ride_id}`,
      redirect_url: `https://mock-midtrans.com/pay/${ride_id}`,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ride_id}`
    }

    // Simpan ke database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase
      .from('rides')
      .update({ payment_status: 'pending', midtrans_order_id: ride_id })
      .eq('id', ride_id)

    return new Response(
      JSON.stringify(mockResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create transaction' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
