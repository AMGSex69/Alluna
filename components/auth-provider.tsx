"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    console.log('🔄 AuthProvider: Client mounted')
  }, [])

  useEffect(() => {
    if (!isClient) {
      console.log('🔄 AuthProvider: Skipping auth init - not on client yet')
      return
    }

    console.log('🔄 AuthProvider: Starting auth initialization')
    
    const getSession = async () => {
      try {
        console.log('🔐 Getting session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Session error:', error)
          return
        }

        console.log('✅ Session result:', session ? `User: ${session.user?.email}` : 'No session')
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('❌ Unexpected error:', error)
      } finally {
        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN') {
          console.log('🎉 User signed in, should redirect to home')
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [isClient])

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('🔐 Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Добавляем отладочную информацию
  console.log('📊 AuthProvider state:', { 
    isClient, 
    loading, 
    user: user ? user.email : 'null',
    hasUser: !!user 
  })

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}