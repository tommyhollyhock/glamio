import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FoglalasButton from './FoglalasButton'

type Props = { params: { slug: string } }

export default async function SzalonPage({ params }: Props) {
  const supabase = await createClient()
  const { data: salon } = await supabase.from('salons').select('*').eq('slug', params.slug).single()
  if (!salon) notFound()
  const { data: services } = await supabase.from('services').select('*').eq('salon_id', salon.id).eq('is_active', true).order('category')
  const { data: staff } = await supabase.from('staff').select('*').eq('salon_id', salon.id).eq('is_active', true).order('name')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">{salon.name}</h1>
          <p className="text-gray-500 mt-1 capitalize">{salon.type} szalon</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Szolgáltatások</h2>
            {services && services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{service.category} · {service.duration_min} perc</p>
                    </div>
                    <p className="font-bold text-gray-900">{(service.price / 100).toLocaleString('hu-HU')} Ft</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Hamarosan...</p>
            )}
          </div>
          {staff && staff.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Csapatunk</h2>
              <div className="grid grid-cols-2 gap-4">
                {staff.map((member) => (
                  <div key={member.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: member.color }}>
                      {member.name.charAt(0)}
                    </div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Időpontfoglalás</h2>
            <p className="text-sm text-gray-500 mb-6">Válassz szolgáltatást és foglalj időpontot online!</p>
            <FoglalasButton slug={params.slug} />
          </div>
        </div>
      </div>
    </div>
  )
}
