import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()

  if (!profile?.salon_id) return NextResponse.json({ error: 'No salon' }, { status: 400 })

  const { data: salon } = await supabase
    .from('salons')
    .select('stripe_customer_id, name')
    .eq('id', profile.salon_id)
    .single()

  let customerId = salon?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: salon?.name,
      metadata: { salon_id: profile.salon_id }
    })
    customerId = customer.id

    await supabase
      .from('salons')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile.salon_id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/beallitasok?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/beallitasok?canceled=true`,
  })

  return NextResponse.json({ url: session.url })
}
