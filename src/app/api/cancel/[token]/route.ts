export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { token } = params

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, guest_name, guest_email, starts_at, services(name)')
    .eq('cancel_token', token)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Foglalás nem található' }, { status: 404 })
  }

  if (booking.status === 'canceled') {
    return NextResponse.json({ error: 'Már lemondva' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'canceled' })
    .eq('cancel_token', token)

  if (updateError) {
    return NextResponse.json({ error: 'Hiba a lemondásnál' }, { status: 500 })
  }

  return NextResponse.json({ success: true, booking })
}
