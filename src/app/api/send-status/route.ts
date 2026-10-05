import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const statusText: Record<string, string> = {
  confirmed: 'megerősítve',
  cancelled: 'lemondva',
}

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email, name, status, date, service } = await request.json()

  try {
    await resend.emails.send({
      from: 'Glamio <onboarding@resend.dev>',
      to: email,
      subject: status === 'confirmed' ? 'Foglalásod megerősítve! ✅' : 'Foglalásod lemondva',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: ${status === 'confirmed' ? '#16a34a' : '#dc2626'};">
            Foglalásod ${statusText[status] ?? status}
          </h2>
          <p>Kedves <strong>${name}</strong>!</p>
          <p>
            ${service ? `<strong>${service}</strong> ` : ''}foglalásod
            (${new Date(date).toLocaleString('hu-HU', { dateStyle: 'long', timeStyle: 'short' })})
            státusza: <strong>${statusText[status] ?? status}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Ez egy automatikus üzenet a Glamio foglalási rendszertől.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Email küldés sikertelen' }, { status: 500 })
  }
}
