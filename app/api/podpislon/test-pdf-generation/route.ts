// app/api/test-pdf-generation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentPDF } from '@/lib/podpislon-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing PDF generation...')
    
    const pdfData = await generateDocumentPDF({
      documentName: 'Тестовый договор',
      clientName: 'Иванов Иван',
      clientPhone: '+79123456789',
      clientEmail: 'test@example.com',
      projectName: 'Тестовый проект'
    })

    // Проверяем что PDF валидный
    let base64Data = pdfData
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      base64Data = pdfData.split(',')[1]
    } else if (pdfData.startsWith('data:')) {
      base64Data = pdfData.split(',')[1]
    }

    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    const blob = new Blob([bytes], { type: 'application/pdf' })

    return NextResponse.json({
      success: true,
      pdfSize: blob.size,
      pdfFormat: pdfData.substring(0, 50),
      pdfLength: pdfData.length,
      isValid: blob.size > 0,
      startsWithCorrectPrefix: pdfData.startsWith('data:application/pdf;base64,')
    })

  } catch (error) {
    console.error('PDF generation test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}