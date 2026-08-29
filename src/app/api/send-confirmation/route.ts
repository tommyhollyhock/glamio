import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { guestName, guestEmail, cancelToken, serviceName, staffName, date, time, salonName } = await request.json()

  try {
    await resend.emails.send({
      from: 'Glamio <onboarding@resend.dev>',
      to: guestEmail,
      subject: `Foglalás visszaigazolás — ${salonName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Foglalás visszaigazolva! 🎉</h2>
          <p>Kedves <strong>${guestName}</strong>!</p>
          <p>Foglalásod sikeresen rögzítettük. Íme a részletek:</p>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Szalon</td>
                <td style="padding: 8px 0; font-weight: bold;">${salonName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Szolgáltatás</td>
                <td style="padding: 8px 0; font-weight: bold;">${serviceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Munkatárs</td>
                <td style="padding: 8px 0; font-weight: bold;">${staffName || 'Bárki'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Időpont</td>
                <td style="padding: 8px 0; font-weight: bold;">${date} ${time}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Ha kérdésed van, keresd fel a szalont közvetlenül.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        Ha le szeretnéd mondani a foglalásod: <a href="https://glamio-five.vercel.app/lemondas/${cancelToken}" style="color: #4f46e5;">Foglalás lemondása</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            Ez egy automatikus üzenet a Glamio foglalási rendszertől.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Email küldés sikertelen' }, { status: 500 })
  }
}