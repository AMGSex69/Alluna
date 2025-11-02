// /api/podpislon/test-auth/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const baseUrl = 'https://podpislon.ru/integration/add-document'
  const apiKey = process.env.PODPISLON_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'PODPISLON_API_KEY not set' }, { status: 500 })
  }

  const testData = {
    name: 'Тест',
    last_name: 'Тестов',
    phone: '+79123456789',
    agreement: '1',
    no_sms: 'Y'
  }

  const testResults = []

  // Тест 1: API ключ в FormData
  try {
    const formData = new FormData()
    formData.append('api_key', apiKey)
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(baseUrl, {
      method: 'POST',
      body: formData,
    })

    testResults.push({
      method: 'FormData with api_key field',
      status: response.status,
      statusText: response.statusText,
      success: response.ok
    })
  } catch (error) {
    testResults.push({
      method: 'FormData with api_key field',
      error: error.message
    })
  }

  // Тест 2: API ключ в заголовке Authorization
  try {
    const formData = new FormData()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData,
    })

    testResults.push({
      method: 'Authorization Header Bearer',
      status: response.status,
      statusText: response.statusText,
      success: response.ok
    })
  } catch (error) {
    testResults.push({
      method: 'Authorization Header Bearer',
      error: error.message
    })
  }

  // Тест 3: API ключ в заголовке X-API-Key
  try {
    const formData = new FormData()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData,
    })

    testResults.push({
      method: 'X-API-Key Header',
      status: response.status,
      statusText: response.statusText,
      success: response.ok
    })
  } catch (error) {
    testResults.push({
      method: 'X-API-Key Header',
      error: error.message
    })
  }

  return NextResponse.json({
    apiKey: apiKey ? `***${apiKey.slice(-4)}` : 'not set',
    testResults
  })
}