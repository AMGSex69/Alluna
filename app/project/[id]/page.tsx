'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
	ArrowLeft,
	FileText,
	Phone,
	Clock,
	CheckCircle,
	Loader2,
	ExternalLink,
} from 'lucide-react'
import { CreateContractDialog } from '@/components/create-contract-dialog'
import { SendForSigningDialog } from '@/components/send-for-signing-dialog'
import { UploadDocumentDialog } from '@/components/upload-document-dialog'

import {
	getProject,
	getProjectDocuments,
	createDocument,
	updateDocumentStatus,
	deleteDocument,
	type DocumentWithIntegration,
} from '@/lib/projects'
import type { Project } from '@/lib/supabase/client'

/* ---------------- helpers ---------------- */

function getStatusBadge(status: string) {
	switch (status) {
		case 'signed':
			return (
				<Badge
					variant='default'
					className='bg-green-100 text-green-800 hover:bg-green-100'
				>
					Подписан
				</Badge>
			)
		case 'pending_signature':
			return (
				<Badge
					variant='default'
					className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
				>
					Ожидает подписи
				</Badge>
			)
		case 'draft':
			return (
				<Badge
					variant='default'
					className='bg-gray-100 text-gray-800 hover:bg-gray-100'
				>
					Черновик
				</Badge>
			)
		default:
			return <Badge variant='secondary'>Неизвестно</Badge>
	}
}

function getStatusIcon(status: string) {
	switch (status) {
		case 'signed':
			return <CheckCircle className='h-4 w-4 text-green-600' />
		case 'pending_signature':
			return <Clock className='h-4 w-4 text-yellow-600' />
		default:
			return <FileText className='h-4 w-4 text-gray-600' />
	}
}

function getDocumentTypeLabel(type: string) {
	switch (type) {
		case 'contract':
			return 'Договор'
		case 'attachment':
			return 'Приложение'
		case 'act':
			return 'Акт'
		case 'agreement':
			return 'Дополнительное соглашение'
		case 'invoice':
			return 'Счет'
		default:
			return 'Документ'
	}
}

/** Маппинг статусов Подпислона в локальные */
function mapPodpislonToLocalStatus(
	status: string | undefined
): 'pending_signature' | 'signed' | 'draft' | 'unknown' {
	const s = (status || '').toLowerCase()
	if (
		s === 'signed' ||
		['30', 'success', 'completed', 'done', 'подписан'].some(x => s.includes(x))
	) {
		return 'signed'
	}
	if (
		s === 'pending_signature' ||
		['15', '10', 'pending', 'created', 'waiting', 'отправлен', 'ожидает'].some(
			x => s.includes(x)
		)
	) {
		return 'pending_signature'
	}
	return 'unknown'
}

/* ============================================================ */

export default function ProjectPage() {
	const params = useParams()
	const router = useRouter()

	const [project, setProject] = useState<Project | null>(null)
	const [documents, setDocuments] = useState<DocumentWithIntegration[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const projectId = params.id as string

	/* -------- загрузка проекта и документов -------- */
	useEffect(() => {
		async function load() {
			setLoading(true)
			setError(null)
			try {
				const [p, docs] = await Promise.all([
					getProject(projectId),
					getProjectDocuments(projectId),
				])
				if (!p) {
					setError('Проект не найден')
					return
				}
				setProject(p)
				setDocuments(docs)
			} catch (e) {
				console.error('[Project] load error:', e)
				setError('Ошибка загрузки данных проекта')
			} finally {
				setLoading(false)
			}
		}
		if (projectId) load()
	}, [projectId])

	/* -------- создание черновика договора (старый флоу) -------- */
	const handleCreateContract = async (contractData: any) => {
		if (!project) return
		const doc = await createDocument({
			project_id: project.id,
			name: `Договор на дизайн-проект №ДП-${Date.now().toString().slice(-6)}`,
			type: 'contract',
			status: 'draft',
			content: JSON.stringify(contractData),
		})
		if (doc) setDocuments(prev => [doc, ...prev])
	}

	/* -------- удаление -------- */
	const handleDeleteDocument = async (
		documentId: string,
		documentName: string,
		e: React.MouseEvent
	) => {
		e.stopPropagation()
		if (!confirm(`Удалить документ "${documentName}"?`)) return
		try {
			const ok = await deleteDocument(documentId)
			if (ok) setDocuments(prev => prev.filter(d => d.id !== documentId))
			else alert('Не удалось удалить документ. Попробуйте ещё раз.')
		} catch {
			alert('Произошла ошибка при удалении документа.')
		}
	}

	/* -------- старый флоу email-отправки для draft -------- */
	const handleSendForSigning = async (
		documentId: string,
		phone: string,
		email?: string
	) => {
		if (!email) {
			alert('Email обязателен для отправки документа на подписание')
			return
		}
		try {
			const doc = documents.find(d => d.id === documentId)
			if (!doc || !project) return

			const res = await fetch('/api/okidoki/send-for-signing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					document_id: documentId,
					document_name: doc.name,
					document_url: doc.file_url || `/api/documents/${documentId}`,
					signer: { name: project.client_name, phone, email },
					metadata: { projectId: project.id, projectName: project.name },
				}),
			})

			if (res.ok) {
				const ok = await updateDocumentStatus(documentId, 'pending_signature')
				if (ok) {
					setDocuments(prev =>
						prev.map(d =>
							d.id === documentId ? { ...d, status: 'pending_signature' } : d
						)
					)
					alert(`Документ отправлен на подпись! Email отправлен на ${email}`)
				}
			} else {
				alert('Ошибка при отправке документа на подпись')
			}
		} catch (e) {
			console.error('[send-for-signing] error', e)
			alert('Произошла ошибка при отправке документа')
		}
	}

	/* -------- новый флоу: создание в Подпислоне из диалога загрузки -------- */
	const handleUploadDocument = async (documentData: {
		type: string
		file?: File
		file_url?: string
		phone?: string
		email?: string
		createdId?: number | string
		signUrl?: string | null
	}) => {
		if (!project) return

		const doc = await createDocument({
			project_id: project.id,
			name: documentData.file?.name || `Документ ${documents.length + 1}`,
			type: (documentData.type as any) ?? 'other',
			status: 'pending_signature',
			file_url: documentData.file_url ?? null,
			podpislon_id: documentData.createdId ?? null,
			sign_url: documentData.signUrl ?? null,
		})

		if (doc) setDocuments(prev => [doc, ...prev])
	}

	/* -------- автопуллинг статусов из Подпислона -------- */
	const pollingList = useMemo(
		() => documents.filter(d => d.podpislon_id && d.status !== 'signed'),
		[documents]
	)

	useEffect(() => {
		if (pollingList.length === 0) return
		let stopped = false
		const INTERVAL = 8000

		async function tick() {
			try {
				const results = await Promise.allSettled(
					pollingList.map(async doc => {
						const extId = String(doc.podpislon_id)
						const res = await fetch(
							`/api/podpislon/status/${encodeURIComponent(extId)}`,
							{
								cache: 'no-store',
							}
						)
						const data = await res.json()
						if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
						return {
							id: doc.id,
							status: String(data?.status || ''),
							signedAt: (data?.signedAt as string | null) ?? null,
						}
					})
				)

				if (stopped) return

				const updates: Array<{
					id: string
					newStatus: 'signed' | 'pending_signature'
					signedAt?: string | null
				}> = []

				for (const r of results) {
					if (r.status !== 'fulfilled') continue
					const local = mapPodpislonToLocalStatus(r.value.status)
					if (local === 'signed') {
						updates.push({
							id: r.value.id,
							newStatus: 'signed',
							signedAt: r.value.signedAt,
						})
					} else if (local === 'pending_signature') {
						updates.push({ id: r.value.id, newStatus: 'pending_signature' })
					}
				}

				if (updates.length) {
					setDocuments(prev =>
						prev.map(d => {
							const u = updates.find(x => x.id === d.id)
							if (!u) return d
							return {
								...d,
								status: u.newStatus,
								signed_at:
									u.newStatus === 'signed'
										? u.signedAt ?? new Date().toISOString()
										: d.signed_at,
							}
						})
					)

					for (const u of updates) {
						if (u.newStatus === 'signed') {
							try {
								await updateDocumentStatus(u.id, 'signed')
							} catch (e) {
								console.warn('[status-sync] persist failed for', u.id, e)
							}
						}
					}
				}
			} catch (e) {
				console.warn('[status-poll] error:', e)
			}
		}

		tick()
		const t = setInterval(tick, INTERVAL)
		return () => {
			stopped = true
			clearInterval(t)
		}
	}, [pollingList])

	/* ---------------- render ---------------- */

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='flex items-center gap-2'>
					<Loader2 className='h-6 w-6 animate-spin' />
					<span>Загрузка проекта...</span>
				</div>
			</div>
		)
	}

	if (error || !project) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<h2 className='text-xl font-semibold text-gray-900 mb-2'>
						{error || 'Проект не найден'}
					</h2>
					<Button onClick={() => router.push('/')} variant='outline'>
						Вернуться к проектам
					</Button>
				</div>
			</div>
		)
	}

	const signedDocuments = documents.filter(d => d.status === 'signed')

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<header className='bg-white border-b border-gray-200'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center h-16'>
						<div className='flex items-center'>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => router.back()}
								className='mr-4'
							>
								<ArrowLeft className='h-4 w-4 mr-2' />
								Назад
							</Button>
							<h1 className='text-2xl font-bold text-gray-900'>ALLUNA</h1>
						</div>
						<div className='flex items-center space-x-4'>
							<div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
								<span className='text-sm font-medium text-gray-700'>Д</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='mb-8'>
					<div className='flex items-start justify-between mb-4'>
						<div>
							<h2 className='text-2xl font-bold text-gray-900 mb-2'>
								{project.name}
							</h2>
							<p className='text-gray-600 mb-4'>{project.description}</p>
						</div>
					</div>

					{/* Client Info */}
					<Card className='mb-6'>
						<CardHeader>
							<CardTitle className='text-lg'>Информация о клиенте</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										Имя клиента
									</p>
									<p className='text-gray-900'>{project.client_name}</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Телефон</p>
									<div className='flex items-center gap-2'>
										<Phone className='h-4 w-4 text-gray-500' />
										<p className='text-gray-900'>{project.client_phone}</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Quick Access to Signed Documents */}
				{signedDocuments.length > 0 && (
					<div className='mb-8'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>
							Быстрый доступ к подписанным документам
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{signedDocuments.map(d => (
								<Card
									key={`signed-${d.id}`}
									className='hover:shadow-md transition-shadow cursor-pointer border-green-200'
									onClick={() => router.push(`/document/${d.id}`)}
								>
									<CardContent className='p-4'>
										<div className='flex items-center gap-3'>
											<CheckCircle className='h-6 w-6 text-green-600' />
											<div className='flex-1'>
												<h4 className='font-medium text-gray-900 text-sm'>
													{d.name}
												</h4>
												<p className='text-xs text-gray-600'>
													Подписан{' '}
													{d.signed_at
														? new Date(d.signed_at).toLocaleDateString('ru-RU')
														: ''}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* Documents Section */}
				<div className='mb-8'>
					<div className='flex justify-between items-center mb-6'>
						<div>
							<h3 className='text-xl font-semibold text-gray-900'>
								Документы проекта
							</h3>
							<p className='text-sm text-gray-600 mt-1'>
								Договоры, приложения и акты по этапам
							</p>
						</div>
						<div className='flex lg:gap-2 lg:flex-row flex-col'>
							<CreateContractDialog
								projectData={{
									name: project.name,
									client: project.client_name,
									clientPhone: project.client_phone,
									description: project.description || '',
								}}
								onCreateContract={handleCreateContract}
							/>
							<UploadDocumentDialog onUploadDocument={handleUploadDocument} />
						</div>
					</div>

					{/* Documents List */}
					<div className='space-y-4'>
						{documents.map(d => {
							const podpislonId = d.podpislon_id
							const signUrl = d.sign_url

							return (
								<Card key={d.id} className='hover:shadow-md transition-shadow'>
									<CardContent className='p-6'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-4'>
												{getStatusIcon(d.status)}
												<div>
													<h4 className='font-medium text-gray-900'>
														{d.name}
													</h4>
													<p className='text-sm text-gray-600'>
														{getDocumentTypeLabel(d.type)} • Создан{' '}
														{new Date(d.created_at).toLocaleDateString('ru-RU')}
														{d.signed_at && (
															<>
																{' '}
																• Подписан{' '}
																{new Date(d.signed_at).toLocaleDateString(
																	'ru-RU'
																)}
															</>
														)}
													</p>
												</div>
											</div>

											<div className='flex items-center lg:flex-row lg:gap-3 flex-col'>
												{getStatusBadge(d.status)}

												{/* Если ждём подписи и есть ссылка — кнопка открытия страницы Подпислона */}
												{d.status === 'pending_signature' && signUrl && (
													<a
														href={signUrl}
														target='_blank'
														rel='noopener noreferrer'
														className='inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md'
													>
														Открыть страницу подписи{' '}
														<ExternalLink className='h-3.5 w-3.5' />
													</a>
												)}

												{/* Для draft — старый e-mail диалог */}
												{d.status === 'draft' && (
													<SendForSigningDialog
														documentName={d.name}
														clientPhone={project.client_phone}
														clientEmail={project.client_email}
														onSendForSigning={(phone, email) =>
															handleSendForSigning(d.id, phone, email)
														}
													/>
												)}

												{d.status === 'pending_signature' && (
													<Badge
														variant='outline'
														className='text-yellow-700 border-yellow-300'
													>
														Отправлен клиенту
													</Badge>
												)}

												<Button
													variant='outline'
													size='sm'
													onClick={() => router.push(`/document/${d.id}`)}
												>
													Просмотр
												</Button>
												<Button
													variant='outline'
													size='sm'
													onClick={e => handleDeleteDocument(d.id, d.name, e)}
													className='text-red-500 hover:text-red-700 hover:bg-red-50 border-red-700'
												>
													Удалить
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>

					{/* Empty State */}
					{documents.length === 0 && (
						<div className='text-center py-12'>
							<FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
							<h3 className='text-lg font-medium text-gray-900 mb-2'>
								Пока нет документов
							</h3>
							<p className='text-gray-600 mb-6'>
								Создайте первый документ для этого проекта
							</p>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
