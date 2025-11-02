// /api/podpislon/debug-api/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.PODPISLON_API_BASE
    const apiKey = process.env.PODPISLON_API_KEY

    console.log('=== PODPISLON API DEBUG ===')
    console.log('Base URL:', baseUrl)
    console.log('API Key exists:', !!apiKey)

    // Тестируем различные базовые URLs
    const baseUrls = [
      'https://api.podpislon.ru',
      'https://podpislon.ru',
      'https://api.podpislon.ru/api',
      'https://podpislon.ru/api',
      'https://api.podpislon.ru/integration',
      'https://podpislon.ru/integration'
    ]

    const endpoints = [
      '/external/contract',
      '/api/external/contract',
      '/v1/contract',
      '/contract/create',
      '/integration/contract'
    ]

    const results = []

    for (const testBaseUrl of baseUrls) {
      for (const endpoint of endpoints) {
        const testUrl = `${testBaseUrl}${endpoint}`
        
        try {
          console.log(`Testing: ${testUrl}`)
          
          const testPayload = {
            api_key: apiKey || 'test-key',
            external_id: 'debug-test-123',
            body: '<p>Test contract</p>',
            source: 'debug-test',
            entities: [],
            system_entities: [
              { keyword: 'client_email', value: 'test@test.com' },
              { keyword: 'email_subject', value: 'Test Subject' }
            ]
          }

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Alluna-Design/1.0'
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal
          })

          clearTimeout(timeout)

          const responseText = await response.text()
          const contentType = response.headers.get('content-type')

          results.push({
            url: testUrl,
            status: response.status,
            statusText: response.statusText,
            contentType: contentType,
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200),
            isJson: contentType?.includes('application/json'),
            success: response.ok
          })

          console.log(`Result: ${response.status} - ${responseText.length} bytes`)

        } catch (error) {
          results.push({
            url: testUrl,
            error: error.message,
            status: 'fetch failed'
          })
          console.log(`Error: ${error.message}`)
        }
      }
    }

    return NextResponse.json({
      environment: {
        PODPISLON_API_BASE: baseUrl,
        PODPISLON_API_KEY: apiKey ? '***' + apiKey.slice(-4) : 'not set'
      },
      testResults: results
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}