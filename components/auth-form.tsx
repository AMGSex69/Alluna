"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AuthFormProps {
  mode?: "signin" | "signup"
}

export function AuthForm({ mode = "signin" }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === "signin") {
        console.log('🔐 Attempting sign in...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          console.error('❌ Sign in error:', error)
          throw error
        }

        if (data.user) {
          console.log('✅ Sign in successful, user:', data.user.email)
          setMessage("Вход выполнен успешно! Перенаправление...")
          
          // Комбинированный подход для надежности
          setTimeout(() => {
            console.log('🔄 Attempting redirect with router...')
            router.push('/')
          }, 500)

          // Резервный вариант через 2 секунды
          setTimeout(() => {
            if (window.location.pathname.includes('/auth/')) {
              console.log('🔄 Router failed, using window.location...')
              window.location.href = '/'
            }
          }, 2000)
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          console.error('❌ Sign up error:', error)
          throw error
        }

        if (data.user) {
          setMessage("Регистрация успешна! Проверьте вашу почту для подтверждения аккаунта.")
          setEmail("")
          setPassword("")
        }
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err)
      setError(err.message || "Произошла непредвиденная ошибка")
    } finally {
      setLoading(false)
    }
  }

  const isSignIn = mode === "signin"

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          {isSignIn ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
          {isSignIn ? "Вход в систему" : "Регистрация"}
        </CardTitle>
        <CardDescription>
          {isSignIn ? "Введите ваши учетные данные для входа" : "Создайте новую учетную запись"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className={isSignIn ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
              {isSignIn ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={isSignIn ? "text-green-800" : "text-blue-800"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              autoComplete={isSignIn ? "current-password" : "new-password"}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isSignIn ? "Вход..." : "Регистрация..."}
              </>
            ) : (
              isSignIn ? "Войти" : "Зарегистрироваться"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {isSignIn ? (
            <p>
              Нет аккаунта?{" "}
              <a href="/auth/signup" className="text-primary hover:underline">
                Зарегистрируйтесь
              </a>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <a href="/auth/signin" className="text-primary hover:underline">
                Войдите
              </a>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}