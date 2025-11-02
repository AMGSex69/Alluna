// /api/podpislon/test-callback/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, fileId, companyId, signature, contact } = body;

    // Формируем данные в формате x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('EVENT', event || 'DOCUMENT_SIGNED');
    formData.append('FILE_ID', fileId || '12345');
    formData.append('COMPANY_ID', companyId || '67890');
    formData.append('SIGNATURE', signature || 'test-signature-123');
    
    if (contact) {
      formData.append('CONTACT', contact);
    }

    // Отправляем тестовый callback на наш же endpoint
    const callbackUrl = `${request.nextUrl.origin}/api/podpislon/callback`;
    
    console.log('[Podpislon] Sending test callback to:', callbackUrl);
    console.log('[Podpislon] Test data:', Object.fromEntries(formData));

    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    
    return NextResponse.json({
      test_sent: true,
      callback_url: callbackUrl,
      test_data: Object.fromEntries(formData),
      callback_response: result
    });

  } catch (error) {
    console.error('[Podpislon] Test callback error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}