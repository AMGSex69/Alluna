// app/api/podpislon/status/[id]/route.ts
import { NextResponse } from 'next/server'

const BASE =
	process.env.PODPISLON_API_BASE || 'https://podpislon.ru/integration'
const API_KEY = process.env.PODPISLON_API_KEY!

function normalizeStatus(raw: string | number | undefined) {
	const s = String(raw ?? '').toLowerCase()
	if (
		['30', 'signed', 'success', 'completed', 'done', 'подписан'].some(x =>
			s.includes(x)
		)
	)
		return 'signed'
	if (
		['15', '10', 'pending', 'created', 'waiting', 'отправлен', 'ожидает'].some(
			x => s.includes(x)
		)
	)
		return 'pending_signature'
	if (['rejected', 'declined', 'отклон'].some(x => s.includes(x)))
		return 'rejected'
	if (['expired', 'просроч'].some(x => s.includes(x))) return 'expired'
	return 'unknown'
}

export async function GET(
	_req: Request,
	{ params }: { params: { id: string } }
) {
	const id = params?.id?.trim()
	if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

	try {
		const body = new URLSearchParams()
		body.append('ids[]', id)

		const res = await fetch(`${BASE}?expand=package`, {
			method: 'POST',
			headers: {
				'X-Api-Key': API_KEY,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
			cache: 'no-store',
		})

		const text = await res.text()
		let json: any
		try {
			json = JSON.parse(text)
		} catch {
			json = text
		}
		if (!res.ok)
			return NextResponse.json(
				{ error: 'upstream_error', details: json },
				{ status: res.status }
			)

		const items = Array.isArray(json)
			? json
			: Array.isArray(json?.value)
			? json.value
			: []
		if (!items.length)
			return NextResponse.json(
				{ error: 'not found in list', items },
				{ status: 404 }
			)

		const first = items[0]
		const statusText = first?.status_text || first?.status || ''
		const normalized = normalizeStatus(first?.status ?? first?.status_text)
		const signedAt = first?.sign_at || first?.date_sign || null

		return NextResponse.json({
			id,
			status: normalized,
			statusText,
			signedAt,
			raw: first,
		})
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'internal_error', message: e?.message || String(e) },
			{ status: 500 }
		)
	}
}
