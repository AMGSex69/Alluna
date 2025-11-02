// /api/podpislon/debug-send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentPDF } from '@/lib/podpislon-utils'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PODPISLON_API_KEY
    const baseUrl = 'https://podpislon.ru/integration/add-document'

    if (!apiKey) {
      return NextResponse.json({ error: 'PODPISLON_API_KEY not set' }, { status: 500 })
    }

    // Генерируем простой тестовый PDF
    const pdfData = await generateDocumentPDF({
      documentName: 'Тестовый договор',
      clientName: 'Иванов Иван',
      clientPhone: '+79123456789',
      clientEmail: 'test@example.com'
    })

    console.log('Generated PDF size:', pdfData.length)

    // Тест 1: Минимальные данные
    const testPayloads = [
      {
        name: 'Тест 1 - Минимальные данные',
        data: {
          name: 'Иван',
          last_name: 'Иванов',
          phone: '+79123456789',
          agreement: '1',
          no_sms: 'Y'
        }
      },
      {
        name: 'Тест 2 - С контактами',
        data: {
          name: 'Иван',
          last_name: 'Иванов', 
          phone: '+79123456789',
          agreement: '1',
          no_sms: 'Y',
          contacts: JSON.stringify([{ type: 'email', value: 'test@example.com' }])
        }
      },
      {
        name: 'Тест 3 - Полные данные',
        data: {
          name: 'Иван',
          last_name: 'Иванов',
          second_name: 'Иванович',
          phone: '+79123456789', 
          agreement: '1',
          no_sms: 'Y',
          contacts: JSON.stringify([{ type: 'email', value: 'test@example.com' }]),
          external_id: 'test-123',
          redirect_url: 'https://example.com'
        }
      }
    ]

    const results = []

    for (const test of testPayloads) {
      try {
        const formData = new FormData()
        
        // Добавляем тестовые данные
        Object.entries(test.data).forEach(([key, value]) => {
          formData.append(key, value as string)
        })

        // Добавляем файл
        const response = await fetch(pdfData)
        const blob = await response.blob()
        formData.append('file', blob, 'test_document.pdf')

        console.log(`Sending ${test.name}...`)
        
        const podpislonResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey
          },
          body: formData,
        })

        const responseText = await podpislonResponse.text()
        
        let parsedResponse
        try {
          parsedResponse = JSON.parse(responseText)
        } catch {
          parsedResponse = { raw: responseText.substring(0, 500) }
        }

        results.push({
          test: test.name,
          status: podpislonResponse.status,
          success: podpislonResponse.ok,
          response: parsedResponse,
          fields: Object.keys(test.data)
        })

        // Если один тест прошел, останавливаемся
        if (podpislonResponse.ok) {
          break
        }

      } catch (error) {
        results.push({
          test: test.name,
          error: error.message,
          success: false
        })
      }
    }

    return NextResponse.json({
      apiKey: `***${apiKey.slice(-4)}`,
      pdfGenerated: true,
      results
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}