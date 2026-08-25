'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
type Service = { id: string; name: string; category: string; duration_min: number; price: number }
type Staff = { id: string; name: string; color: string }
type Step = 'service' | 'staff' | 'datetime' | 'details' | 'confirm'
export default function FoglalasPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()
  const [step, setStep] = useState<Step>('service')
  const [salonId, setSalonId] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [sel, setSel] = useState<Service | null>(null)
  const [selStaff, setSelStaff] = useState<Staff | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    supabase.from('salons').select('id').eq('slug', slug).single().then(({ data }) => {
      if (!data) return
      setSalonId(data.id)
      supabase.from('services').select('*').eq('salon_id', data.id).eq('is_active', true).order('category').then(({ data: s }) => setServices(s || []))
      supabase.from('staff').select('*').eq('salon_id', data.id).eq('is_active', true).order('name').then(({ data: st }) => setStaff(st || []))
    })
  }, [slug])
  const book = async () => {
    if (!sel || !date || !time) return
    setLoading(true)
    const start = new Date(`${date}T${time}:00`)
    const end = new Date(start.getTime() + sel.duration_min * 60000)
    await supabase.from('bookings').insert({
      salon_id: salonId, staff_id: selStaff?.id || staff[0]?.id,
      service_id: sel.id, guest_name: name, guest_email: email,
      guest_phone: phone, notes, starts_at: start.toISOString(),
      ends_at: end.toISOString(), total_price: sel.price, status: 'pending'
    })
    setLoading(false)
        await fetch('/api/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: name,
        guestEmail: email,
        serviceName: sel.name,
        staffName: selStaff?.name,
        date,
        time,
        salonName: slug,
      }),
        })
    setDone(true)
  }
  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Foglalás elküldve!</h1>
        <p className="text-gray-500 mb-6">Hamarosan visszajelzést kapsz email-ben.</p>
        <button onClick={() => router.push(`/${slug}`)} className="text-indigo-600 font-medium hover:underline">Vissza a szalon oldalára</button>
      </div>
    </div>
  )
  const steps: Step[] = ['service','staff','datetime','details','confirm']
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button onClick={() => router.push(`/${slug}`)} className="text-gray-500 text-sm">← Vissza</button>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Időpontfoglalás</h1>
      </div>
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex gap-2 max-w-2xl mx-auto">
          {steps.map((s, i) => <div key={s} className={`flex-1 h-1.5 rounded-full ${steps.indexOf(step) >= i ? 'bg-indigo-600' : 'bg-gray-200'}`} />)}
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {step === 'service' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Válassz szolgáltatást</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <button key={s.id} onClick={() => { setSel(s); setStep('staff') }} className="w-full bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md border border-transparent hover:border-indigo-300 transition-all text-left">
                  <div><p className="font-semibold text-gray-900">{s.name}</p><p className="text-sm text-gray-500">{s.category} · {s.duration_min} perc</p></div>
                  <p className="font-bold text-gray-900">{(s.price/100).toLocaleString('hu-HU')} Ft</p>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 'staff' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Válassz munkatársat</h2>
            <div className="space-y-3">
              <button onClick={() => { setSelStaff(null); setStep('datetime') }} className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md border border-transparent hover:border-indigo-300 transition-all text-left">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">🎲</div>
                <div><p className="font-semibold text-gray-900">Mindegy, bárki</p><p className="text-sm text-gray-500">Az első szabad időpontot foglaljuk</p></div>
              </button>
              {staff.map((m) => (
                <button key={m.id} onClick={() => { setSelStaff(m); setStep('datetime') }} className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md border border-transparent hover:border-indigo-300 transition-all text-left">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('service')} className="mt-4 text-sm text-gray-500">← Vissza</button>
          </div>
        )}
        {step === 'datetime' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Válassz időpontot</h2>
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Dátum</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Időpont</label>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'].map((t) => (
                    <button key={t} onClick={() => setTime(t)} className={`py-2 rounded-lg text-sm font-medium ${time===t?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700 hover:bg-indigo-50'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('staff')} className="text-sm text-gray-500">← Vissza</button>
              <button onClick={() => setStep('details')} disabled={!date||!time} className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Tovább →</button>
            </div>
          </div>
        )}
        {step === 'details' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Adataid</h2>
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Neved *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Kovács Anna" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="anna@email.hu" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+36 30 123 4567" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzés</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('datetime')} className="text-sm text-gray-500">← Vissza</button>
              <button onClick={() => setStep('confirm')} disabled={!name||!email||!phone} className="ml-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Tovább →</button>
            </div>
          </div>
        )}
        {step === 'confirm' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Összefoglaló</h2>
            <div className="bg-white rounded-2xl shadow p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Szolgáltatás</span><span className="font-medium">{sel?.name}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Munkatárs</span><span className="font-medium">{selStaff?.name||'Bárki'}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Időpont</span><span className="font-medium">{date} {time}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Név</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Ár</span><span className="font-bold text-indigo-600">{sel&&(sel.price/100).toLocaleString('hu-HU')} Ft</span></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep('details')} className="text-sm text-gray-500">← Vissza</button>
              <button onClick={book} disabled={loading} className="ml-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">{loading?'Foglalás...':'✓ Foglalás megerősítése'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}