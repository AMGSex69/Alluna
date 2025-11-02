// app/api/debug-pdf-format/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { file_data } = body

    return NextResponse.json({
      received: true,
      file_data_type: typeof file_data,
      file_data_length: file_data?.length,
      file_data_starts_with: file_data?.substring(0, 50),
      is_data_url: file_data?.startsWith('data:'),
      is_pdf_data_url: file_data?.startsWith('data:application/pdf'),
      is_pdf_base64_data_url: file_data?.startsWith('data:application/pdf;base64,')
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}