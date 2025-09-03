import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		console.log('[OkiDoki] Send for signing request:', body)

		const { document_id, document_name, document_url, signer, metadata } = body

		if (!document_id || !document_name || !signer?.email) {
			return NextResponse.json(
				{ error: 'document_id, document_name, and signer.email are required' },
				{ status: 400 }
			)
		}

		const baseUrl = process.env.OKIDOKI_BASE_URL || 'api.doki.online'
		const apiKey = process.env.OKIDOKI_API_KEY || '67gZSOPuU6ahC5h3ZFTlICsjj1sBuMW-'
		const fullUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`

		// Create contract with HTML body for better email presentation
		const contractBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Договор оказания услуг по дизайну</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Стороны договора:</h2>
          <p><strong>Исполнитель:</strong> ООО "Alluna Design"</p>
          <p><strong>Заказчик:</strong> ${signer.name}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Предмет договора:</h3>
          <p>Исполнитель обязуется оказать услуги по дизайну интерьера согласно техническому заданию, а Заказчик обязуется принять и оплатить данные услуги.</p>
        </div>

        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Условия договора:</h3>
          <p>Документ: <strong>${document_name}</strong></p>
          <p>Дата создания: <strong>${new Date().toLocaleDateString('ru-RU')}</strong></p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Подписание договора:</strong> Настоящий договор вступает в силу с момента его подписания обеими сторонами.</p>
        </div>
      </div>
    `

		const payload = {
			api_key: apiKey,
			external_id: document_id,
			body: contractBody,
			source: 'alluna-app',
			entities: [],
			system_entities: [
				{ keyword: 'client_first_name', value: signer.name.split(' ')[0] || '' },
				{ keyword: 'client_last_name', value: signer.name.split(' ')[1] || '' },
				{ keyword: 'client_phone_number', value: signer.phone || '' },
				{ keyword: 'client_email', value: signer.email },
				{ keyword: 'email_subject', value: `Договор для подписания: ${document_name}` }
			],
			callback_url: `${request.nextUrl.origin}/api/okidoki/callback`
		}

		console.log('[OkiDoki] Sending request to:', `${fullUrl}/external/contract`)
		console.log('[OkiDoki] Payload:', payload)

		const response = await fetch(`${fullUrl}/external/contract`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})

		console.log('[OkiDoki] Response status:', response.status)
		console.log('[OkiDoki] Response headers:', Object.fromEntries(response.headers.entries()))

		const responseText = await response.text()
		console.log('[OkiDoki] Raw response:', responseText)

		// Check if response is JSON
		const contentType = response.headers.get('content-type')
		if (!contentType || !contentType.includes('application/json')) {
			console.error('[OkiDoki] Non-JSON response received:', responseText)
			return NextResponse.json(
				{
					error: 'OkiDoki API returned non-JSON response',
					details: responseText,
					status: response.status
				},
				{ status: 500 }
			)
		}

		const data = JSON.parse(responseText)
		console.log('[OkiDoki] Parsed response:', data)

		if (!response.ok) {
			return NextResponse.json(
				{
					error: 'OkiDoki API error',
					details: data,
					status: response.status
				},
				{ status: response.status }
			)
		}

		return NextResponse.json({
			success: true,
			signing_id: data.contract_id,
			contract_id: data.contract_id,
			status: 'sent',
			signing_url: data.link,
			link: data.link,
			message: data.message || 'Договор создан и отправлен на email клиенту',
			provider: 'okidoki'
		})

	} catch (error) {
		console.error('[OkiDoki] Send for signing error:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		)
	}
}
