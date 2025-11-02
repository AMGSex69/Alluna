// /api/podpislon/debug-send-for-signing/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG START ===')
    
    // Проверяем переменные окружения
    const baseUrl = process.env.PODPISLON_API_BASE
    const apiKey = process.env.PODPISLON_API_KEY
    
    console.log('PODPISLON_API_BASE:', baseUrl ? 'SET' : 'NOT SET')
    console.log('PODPISLON_API_KEY:', apiKey ? 'SET' : 'NOT SET')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PODPISLON_API_KEY is not set' },
        { status: 500 }
      )
    }
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'PODPISLON_API_BASE is not set' },
        { status: 500 }
      )
    }
    
    // Проверяем тело запроса
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Debug check passed',
      env: {
        baseUrl: baseUrl ? 'set' : 'not set',
        apiKey: apiKey ? 'set' : 'not set'
      },
      body: body
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    )
  }
}