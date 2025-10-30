"use client"

import { useAuthContext } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRouteFixed({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    console.log('🛡️ ProtectedRoute state:', { loading, user: user?.email })
    
    if (!loading && !user) {
      console.log('🛡️ No user, redirecting to signin')
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // Если идет загрузка, показываем индикатор
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  // Если пользователя нет (и загрузка завершена), показываем индикатор редиректа
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Перенаправление на страницу входа...</p>
        </div>
      </div>
    )
  }

  // Если пользователь есть, рендерим детей
  console.log('🛡️ ProtectedRoute: User authenticated, rendering children')
  return <>{children}</>
}