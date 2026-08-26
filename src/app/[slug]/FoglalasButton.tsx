'use client'
import { useRouter } from 'next/navigation'

export default function FoglalasButton({ slug }: { slug: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/${slug}/foglalas`)}
      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
    >
      Időpontot foglalok
    </button>
  )
}
