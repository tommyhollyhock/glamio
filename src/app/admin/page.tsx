export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-500 mb-8">Üdvözöljük a szalon admin felületen!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Mai foglalások</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">0</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Összes ügyfél</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">0</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Értékelések</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}