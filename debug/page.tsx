"use client"

import { useAuthContext } from "@/components/auth-provider"
import { useEffect } from "react"

export default function DebugPage() {
  const { user, loading } = useAuthContext()

  useEffect(() => {
    console.log('🐛 Debug page mounted')
    console.log('🐛 Auth state:', { loading, user: user?.email })
  }, [user, loading])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Диагностика</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Состояние аутентификации:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify({
            loading,
            user: user ? {
              id: user.id,
              email: user.email,
              created_at: user.created_at
            } : null
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Действия:</h2>
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/'}
            className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded border"
          >
            Перейти на главную страницу
          </button>
          <button
            onClick={() => window.location.reload()}
            className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded border"
          >
            Обновить страницу
          </button>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="block w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded border"
          >
            Перейти на страницу входа
          </button>
        </div>
      </div>
    </div>
  )
}