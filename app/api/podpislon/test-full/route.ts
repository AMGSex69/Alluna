// /api/podpislon/test-full/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentPDF } from '@/lib/podpislon-utils'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PODPISLON_API_KEY
    const baseUrl = 'https://podpislon.ru/integration/add-document'

    if (!apiKey) {
      return NextResponse.json({ error: 'PODPISLON_API_KEY not set' }, { status: 500 })
    }

    // Генерируем тестовый PDF
    console.log('Generating test PDF...')
    const pdfData = await generateDocumentPDF({
      documentName: 'Тестовый договор',
      clientName: 'Иванов Иван Иванович',
      clientPhone: '+79123456789',
      clientEmail: 'test@example.com',
      projectName: 'Тестовый проект'
    })

    console.log('PDF generated, size:', pdfData.length)

    // Создаем FormData
    const formData = new FormData()
    
    // Обязательные поля
    formData.append('name', 'Иван')
    formData.append('last_name', 'Иванов')
    formData.append('phone', '+79123456789')
    formData.append('agreement', '1')
    formData.append('second_name', 'Иванович')
    formData.append('no_sms', 'Y')

    // Контакты
    formData.append('contacts', JSON.stringify([{ 
      type: 'email', 
      value: 'test@example.com' 
    }]))

    // Файл
    const response = await fetch(pdfData)
    const blob = await response.blob()
    formData.append('file', blob, 'test_document.pdf')

    console.log('Sending request to Podpislon...')

    // Отправляем запрос
    const podpislonResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      },
      body: formData,
    })

    const responseText = await podpislonResponse.text()
    console.log('Podpislon response:', podpislonResponse.status, responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { raw: responseText }
    }

    return NextResponse.json({
      success: podpislonResponse.ok,
      status: podpislonResponse.status,
      statusText: podpislonResponse.statusText,
      response: data,
      pdfGenerated: true,
      pdfSize: pdfData.length
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}