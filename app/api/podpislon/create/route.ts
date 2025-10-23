// app/api/podpislon/create/route.ts
import { NextResponse } from 'next/server'

const BASE =
	process.env.PODPISLON_API_BASE || 'https://podpislon.ru/integration'
const API_KEY = process.env.PODPISLON_API_KEY!

export async function POST(req: Request) {
	try {
		const form = await req.formData()
		const file = form.get('file') as File | null
		const phone = String(form.get('phone') || '')
		const email = String(form.get('email') || '')
		const title = String(form.get('title') || (file?.name ?? 'Документ'))

		if (!file)
			return NextResponse.json({ error: 'file is required' }, { status: 400 })
		if (!phone)
			return NextResponse.json({ error: 'phone is required' }, { status: 400 })

		// 1) создаём документ
		const fd = new FormData()
		fd.set('name', 'Клиент')
		fd.set('last_name', 'Получатель')
		fd.set('phone', phone)
		if (email) fd.set('email', email)
		fd.set('agreement', 'Y')
		fd.set('title', title)
		// у некоторых инсталляций нужен ключ file[], у других file — оставим file
		fd.append('file', file, file.name)

		const createRes = await fetch(`${BASE}/add-document`, {
			method: 'PUT',
			headers: { 'X-Api-Key': API_KEY },
			body: fd,
			cache: 'no-store',
		})

		const createdTxt = await createRes.text()
		let created: any = {}
		try {
			created = JSON.parse(createdTxt)
		} catch {}
		if (!createRes.ok || !created?.result) {
			return NextResponse.json(
				{ error: 'create_failed', details: created },
				{ status: 500 }
			)
		}

		const docId = String(created.result)

		// 2) добираем ссылку на подпись
		const body = new URLSearchParams()
		body.append('ids[]', docId)
		const infoRes = await fetch(`${BASE}?expand=package`, {
			method: 'POST',
			headers: {
				'X-Api-Key': API_KEY,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
			cache: 'no-store',
		})

		const infoTxt = await infoRes.text()
		let info: any = {}
		try {
			info = JSON.parse(infoTxt)
		} catch {}
		const items = Array.isArray(info)
			? info
			: Array.isArray(info?.value)
			? info.value
			: []
		const first = items[0] || {}
		const signUrl =
			first?.contact?.link ||
			(Array.isArray(first?.contacts) ? first.contacts[0]?.link : null) ||
			null

		return NextResponse.json({
			status: created?.status ?? true,
			result: docId,
			signUrl,
			contact: first?.contact ?? null,
			raw: first,
		})
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'internal_error', message: e?.message || String(e) },
			{ status: 500 }
		)
	}
}
