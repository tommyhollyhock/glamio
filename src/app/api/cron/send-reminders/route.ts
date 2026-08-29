import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, starts_at, cancel_token, services(name), salons(name)')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('starts_at', now.toISOString())
    .lte('starts_at', in24h.toISOString())

  if (error || !bookings?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const b of bookings) {
    const date = new Date(b.starts_at)
    const formattedDate = date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
    const formattedTime = date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    const salonName = (b as any).salons?.name || 'Szalon'
    const serviceName = (b as any).services?.name || ''

    try {
      await resend.emails.send({
        from: 'Glamio <onboarding@resend.dev>',
        to: b.guest_email,
        subject: `Emlékeztető: holnapi foglalásod - ${salonName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Emlékeztető</h2>
            <p>Kedves <strong>${b.guest_name}</strong>!</p>
            <p>Emlékeztetünk, hogy holnap foglalásod van:</p>
            <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Szalon:</strong> ${salonName}</p>
              <p style="margin: 4px 0;"><strong>Szolgáltatás:</strong> ${serviceName}</p>
              <p style="margin: 4px 0;"><strong>Időpont:</strong> ${formattedDate}, ${formattedTime}</p>
            </div>
            <p>Ha le szeretnéd mondani: <a href="https://glamio-five.vercel.app/lemondas/${b.cancel_token}" style="color: #4f46e5;">Foglalás lemondása</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">Automatikus emlékeztető a Glamio rendszertől.</p>
          </div>
        `,
      })

      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', b.id)

      sent++
    } catch (e) {
      console.error('Reminder email hiba:', b.id, e)
    }
  }

  return NextResponse.json({ sent })
}
