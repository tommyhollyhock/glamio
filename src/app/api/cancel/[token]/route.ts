import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const { token } = params

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, guest_name, guest_email, starts_at, services(name)')
    .eq('cancel_token', token)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Foglalás nem található' }, { status: 404 })
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Ez a foglalás már le van mondva' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('cancel_token', token)

  if (error) {
    return NextResponse.json({ error: 'Hiba a lemondás során' }, { status: 500 })
  }

  return NextResponse.json({ success: true, booking })
}

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const { token } = params

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, status, guest_name, starts_at, services(name)')
    .eq('cancel_token', token)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Foglalás nem található' }, { status: 404 })
  }

  return NextResponse.json({ booking })
}
