'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Mail, FileText, ExternalLink } from 'lucide-react'

export default function TestEmailFlowPage() {
	const [loading, setLoading] = useState(false)
	const [results, setResults] = useState<any[]>([])
	const [currentStep, setCurrentStep] = useState(0)
	const [contractData, setContractData] = useState({
		external_id: 'email_contract_' + Date.now(),
		body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Договор оказания услуг</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Стороны договора:</h2>
          <p><strong>Исполнитель:</strong> ООО "Alluna Design"</p>
          <p><strong>Заказчик:</strong> <span data-keyword="client_name">[Имя клиента]</span></p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Предмет договора:</h3>
          <p>Исполнитель обязуется оказать услуги по дизайну интерьера, а Заказчик обязуется принять и оплатить данные услуги.</p>
        </div>

        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Стоимость услуг:</h3>
          <p style="font-size: 18px;"><strong><span data-keyword="price">[Цена]</span> рублей</strong></p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Сроки выполнения:</h3>
          <p>Срок выполнения работ: до <span data-keyword="deadline">[Срок]</span></p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Подписание договора:</h3>
          <p>Настоящий договор вступает в силу с момента его подписания обеими сторонами.</p>
          <p><strong>Дата заключения:</strong> <span data-keyword="contract_date">[Дата]</span></p>
        </div>
      </div>
    `,
		source: 'alluna-app-email-flow',
		client_name: 'Иван Иванович Петров',
		client_phone: '+79001234567',
		client_email: '',
		price: '150000',
		deadline: '31.03.2025',
		contract_date: new Date().toLocaleDateString('ru-RU')
	})

	const addResult = (title: string, data: any, step?: number) => {
		const timestamp = new Date().toLocaleTimeString()
		setResults(prev => [{ title, data, timestamp, step }, ...prev])
		if (step !== undefined) {
			setCurrentStep(step)
		}
	}

	const steps = [
		{ id: 0, title: 'Подготовка', description: 'Настройка данных договора' },
		{ id: 1, title: 'Создание договора', description: 'Отправка в OkiDoki API' },
		{ id: 2, title: 'Email отправлен', description: 'Клиент получает письмо' },
		{ id: 3, title: 'Подписание', description: 'Клиент подписывает по ссылке' },
		{ id: 4, title: 'Завершено', description: 'Договор подписан' }
	]

	const createContractWithEmail = async () => {
		if (!contractData.client_email) {
			alert('Пожалуйста, укажите email клиента!')
			return
		}

		setLoading(true)
		setCurrentStep(1)

		try {
			console.log('Creating contract with email notification...')

			const payload = {
				document_id: contractData.external_id,
				document_name: `Договор на дизайн интерьера`,
				document_url: '/api/documents/test',
				signer: {
					name: contractData.client_name,
					phone: contractData.client_phone,
					email: contractData.client_email
				},
				metadata: {
					price: contractData.price,
					deadline: contractData.deadline,
					contract_date: contractData.contract_date
				}
			}

			console.log('Sending request to OkiDoki API...')

			const response = await fetch('/api/okidoki/send-for-signing', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			})

			const responseText = await response.text()
			console.log('Response text:', responseText)

			let data
			try {
				data = JSON.parse(responseText)
			} catch (parseError) {
				data = { raw_response: responseText, parse_error: String(parseError) }
			}

			if (response.ok && data.success) {
				setCurrentStep(2)
				addResult('✅ Договор создан успешно!', {
					success: true,
					contract_id: data.contract_id,
					link: data.link,
					status: data.status,
					message: data.message,
					email_sent: true,
					client_email: contractData.client_email
				}, 2)

				// Имитация получения email
				setTimeout(() => {
					addResult('📧 Email отправлен клиенту', {
						recipient: contractData.client_email,
						subject: `Договор на дизайн интерьера - требуется подпись`,
						signing_link: data.link,
						instructions: 'Клиент должен перейти по ссылке в письме для подписания'
					}, 3)
				}, 2000)

			} else {
				addResult('❌ Ошибка создания договора', {
					success: false,
					status: response.status,
					error: data
				})
			}

		} catch (error) {
			addResult('❌ Ошибка соединения', { error: String(error) })
		} finally {
			setLoading(false)
		}
	}

	const testEmailValidation = () => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		const isValid = emailRegex.test(contractData.client_email)

		addResult('📧 Проверка email', {
			email: contractData.client_email,
			valid: isValid,
			message: isValid ? 'Email корректен' : 'Некорректный формат email'
		})
	}

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">📧 Email Flow для подписания договоров</h1>
				<p className="text-muted-foreground">
					Полный цикл создания и подписания договоров через Email уведомления (работает без Supabase)
				</p>
			</div>

			{/* Progress Steps */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Процесс подписания</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between mb-4">
						{steps.map((step, index) => (
							<div key={step.id} className="flex flex-col items-center">
								<div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${currentStep >= step.id
										? 'bg-green-500 border-green-500 text-white'
										: 'border-gray-300 text-gray-500'
									}`}>
									{currentStep > step.id ? (
										<CheckCircle className="w-5 h-5" />
									) : (
										<span className="text-sm font-medium">{step.id + 1}</span>
									)}
								</div>
								<div className="mt-2 text-center">
									<div className="text-sm font-medium">{step.title}</div>
									<div className="text-xs text-muted-foreground">{step.description}</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Configuration */}
				<Card>
					<CardHeader>
						<CardTitle>Настройки договора</CardTitle>
						<CardDescription>
							Заполните данные для создания договора
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">Имя клиента</label>
							<Input
								value={contractData.client_name}
								onChange={(e) => setContractData({ ...contractData, client_name: e.target.value })}
								placeholder="Иван Иванович Петров"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Телефон</label>
								<Input
									value={contractData.client_phone}
									onChange={(e) => setContractData({ ...contractData, client_phone: e.target.value })}
									placeholder="+79001234567"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Email клиента *</label>
								<div className="flex gap-2">
									<Input
										value={contractData.client_email}
										onChange={(e) => setContractData({ ...contractData, client_email: e.target.value })}
										placeholder="client@example.com"
										className={contractData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractData.client_email) ? 'border-red-500' : ''}
									/>
									<Button variant="outline" size="sm" onClick={testEmailValidation}>
										<Mail className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Стоимость (руб.)</label>
								<Input
									value={contractData.price}
									onChange={(e) => setContractData({ ...contractData, price: e.target.value })}
									placeholder="150000"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Срок выполнения</label>
								<Input
									value={contractData.deadline}
									onChange={(e) => setContractData({ ...contractData, deadline: e.target.value })}
									placeholder="31.03.2025"
								/>
							</div>
						</div>

						<div className="pt-4">
							<Button
								onClick={createContractWithEmail}
								disabled={loading || !contractData.client_email}
								className="w-full"
							>
								{loading ? 'Создание договора...' : '📧 Создать договор и отправить Email'}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Contract Preview */}
				<Card>
					<CardHeader>
						<CardTitle>Предварительный просмотр договора</CardTitle>
						<CardDescription>
							Так будет выглядеть договор для клиента
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
							<div
								dangerouslySetInnerHTML={{
									__html: contractData.body
										.replace('[Имя клиента]', contractData.client_name)
										.replace('[Цена]', contractData.price)
										.replace('[Срок]', contractData.deadline)
										.replace('[Дата]', contractData.contract_date)
								}}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Results */}
			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Результаты тестирования</CardTitle>
					<CardDescription>
						История операций и ответы API
					</CardDescription>
				</CardHeader>
				<CardContent>
					{results.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>Результаты появятся после создания договора</p>
						</div>
					) : (
						<div className="space-y-4 max-h-96 overflow-y-auto">
							{results.map((result, index) => (
								<div key={index} className="border rounded-lg p-4">
									<div className="flex justify-between items-start mb-2">
										<div className="flex items-center gap-2">
											<h4 className="font-medium">{result.title}</h4>
											{result.step !== undefined && (
												<Badge variant="outline">Шаг {result.step + 1}</Badge>
											)}
										</div>
										<span className="text-sm text-muted-foreground">{result.timestamp}</span>
									</div>

									{result.data.signing_link && (
										<div className="mb-3 p-3 bg-blue-50 rounded-lg">
											<p className="text-sm font-medium text-blue-900 mb-2">Ссылка для подписания:</p>
											<a
												href={result.data.signing_link}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
											>
												{result.data.signing_link}
												<ExternalLink className="w-4 h-4" />
											</a>
										</div>
									)}

									<pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
										{JSON.stringify(result.data, null, 2)}
									</pre>
								</div>
							))}
						</div>
					)}

					{results.length > 0 && (
						<Button
							variant="outline"
							onClick={() => { setResults([]); setCurrentStep(0); }}
							className="mt-4"
						>
							Очистить результаты
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
