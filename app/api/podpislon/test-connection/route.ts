// /api/podpislon/test-connection/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.PODPISLON_API_BASE
  const apiKey = process.env.PODPISLON_API_KEY

  const testUrls = [
    'https://podpislon.ru/external/contract',
    'https://podpislon.ru/api/external/contract',
    'https://podpislon.ru/integration/external/contract',
    'https://api.podpislon.ru/external/contract',
    'https://api.podpislon.ru/v1/contract'
  ]

  const results = []

  for (const testUrl of testUrls) {
    try {
      console.log(`Testing: ${testUrl}`)
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, test: true })
      })
      
      const text = await response.text()
      results.push({
        url: testUrl,
        status: response.status,
        contentType: response.headers.get('content-type'),
        isJson: text.startsWith('{') || text.startsWith('['),
        preview: text.substring(0, 100)
      })
    } catch (error) {
      results.push({
        url: testUrl,
        error: error.message,
        status: 'failed'
      })
    }
  }

  return NextResponse.json({
    environment: {
      PODPISLON_API_BASE: baseUrl ? 'set' : 'not set',
      PODPISLON_API_KEY: apiKey ? 'set' : 'not set'
    },
    testResults: results
  })
}