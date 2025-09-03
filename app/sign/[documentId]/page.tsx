"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Shield, CheckCircle, AlertCircle, Mail, Download } from "lucide-react"

// Mock document data - in real app this would come from database
const mockDocument = {
	id: "1",
	name: "Договор на дизайн-проект №ДП-123456",
	projectName: "Квартира на Арбате",
	clientName: "Иванов Иван Иванович",
	clientEmail: "client@example.com",
	designerName: "Дизайнер Анна",
	totalAmount: "150000",
	advancePayment: "75000",
	workPeriod: "30",
	createdAt: "2024-01-15",
	status: "pending_signature",
}

export default function SignDocumentPage() {
	const params = useParams()
	const [document] = useState(mockDocument)
	const [step, setStep] = useState<"review" | "signing" | "signed">("review")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

	const documentId = params.documentId as string

	const handleSignDocument = async () => {
		setIsLoading(true)
		setError("")

		try {
			// Simulate signing process
			console.log("Signing document:", documentId)

			// In real implementation, this would call OkiDoki API to complete signing
			await new Promise(resolve => setTimeout(resolve, 2000))

			setStep("signed")
			setSuccess("Документ успешно подписан!")

		} catch (err) {
			setError("Ошибка при подписании документа. Попробуйте еще раз.")
		} finally {
			setIsLoading(false)
		}
	}

	const handleDownloadSigned = async () => {
		// In real implementation, this would download the signed document
		console.log("Downloading signed document:", documentId)
		alert("Функция загрузки подписанного документа будет реализована")
	}

	if (step === "signed") {
		return (
			<div className="container mx-auto max-w-2xl p-6">
				<Card className="border-green-200 bg-green-50">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-6 w-6 text-green-600" />
						</div>
						<CardTitle className="text-green-900">Документ подписан!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<Alert className="border-green-200 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								{success}
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Документ: <span className="font-medium">{document.name}</span>
							</p>
							<p className="text-sm text-muted-foreground">
								Подписан: <span className="font-medium">{new Date().toLocaleString('ru-RU')}</span>
							</p>
						</div>

						<div className="flex flex-col gap-3 pt-4">
							<Button onClick={handleDownloadSigned} className="w-full">
								<Download className="mr-2 h-4 w-4" />
								Скачать подписанный документ
							</Button>
							<Button variant="outline" onClick={() => window.close()}>
								Закрыть окно
							</Button>
						</div>

						<div className="pt-4 text-xs text-muted-foreground">
							<p>Копия подписанного документа также отправлена на ваш email.</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto max-w-4xl p-6">
			<div className="mb-8">
				<div className="flex items-center gap-2 mb-4">
					<FileText className="h-6 w-6 text-blue-600" />
					<h1 className="text-2xl font-bold">Подписание документа</h1>
				</div>
				<p className="text-muted-foreground">
					Пожалуйста, внимательно ознакомьтесь с документом перед подписанием
				</p>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Document Details */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									{document.name}
								</CardTitle>
								<Badge variant="outline">
									{document.status === "pending_signature" ? "Ожидает подписи" : document.status}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Проект</h3>
									<p className="font-medium">{document.projectName}</p>
								</div>
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Дизайнер</h3>
									<p className="font-medium">{document.designerName}</p>
								</div>
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Общая стоимость</h3>
									<p className="font-medium text-lg text-green-600">{Number(document.totalAmount).toLocaleString('ru-RU')} ₽</p>
								</div>
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Предоплата</h3>
									<p className="font-medium">{Number(document.advancePayment).toLocaleString('ru-RU')} ₽</p>
								</div>
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Срок выполнения</h3>
									<p className="font-medium">{document.workPeriod} дней</p>
								</div>
								<div>
									<h3 className="font-medium text-sm text-muted-foreground mb-2">Дата создания</h3>
									<p className="font-medium">{new Date(document.createdAt).toLocaleDateString('ru-RU')}</p>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<h3 className="font-medium">Основные условия договора:</h3>
								<div className="space-y-2 text-sm text-muted-foreground">
									<p>• Исполнитель обязуется разработать дизайн-проект интерьера согласно техническому заданию</p>
									<p>• Заказчик обязуется предоставить доступ к объекту и оплатить услуги согласно условиям</p>
									<p>• Предоплата составляет 50% от общей стоимости и вносится в течение 3 дней после подписания</p>
									<p>• Окончательный расчет производится после сдачи готового проекта</p>
									<p>• Гарантийный срок на выполненные работы составляет 12 месяцев</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Signing Panel */}
				<div>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-green-600" />
								Подписание
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<h3 className="font-medium text-sm">Клиент</h3>
								<p className="font-medium">{document.clientName}</p>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Mail className="h-4 w-4" />
									{document.clientEmail}
								</div>
							</div>

							<Separator />

							{step === "review" && (
								<div className="space-y-4">
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											Внимательно ознакомьтесь с условиями договора перед подписанием.
										</AlertDescription>
									</Alert>

									<div className="space-y-2">
										<div className="flex items-center space-x-2">
											<input type="checkbox" id="terms" className="rounded" required />
											<label htmlFor="terms" className="text-sm">
												Я ознакомился с условиями договора и согласен с ними
											</label>
										</div>
										<div className="flex items-center space-x-2">
											<input type="checkbox" id="personal-data" className="rounded" required />
											<label htmlFor="personal-data" className="text-sm">
												Я согласен на обработку персональных данных
											</label>
										</div>
									</div>

									<Button
										onClick={handleSignDocument}
										disabled={isLoading}
										className="w-full"
									>
										{isLoading ? "Подписание..." : "Подписать документ"}
									</Button>
								</div>
							)}

							{step === "signing" && (
								<div className="space-y-4">
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											Документ подписывается...
										</AlertDescription>
									</Alert>
								</div>
							)}

							<div className="pt-4 text-xs text-muted-foreground">
								<div className="flex items-center gap-2 mb-2">
									<Shield className="h-4 w-4" />
									<span className="font-medium">Защищено OkiDoki</span>
								</div>
								<p>
									Электронная подпись имеет юридическую силу согласно ФЗ-63 "Об электронной подписи"
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="mt-4">
						<CardHeader>
							<CardTitle className="text-sm">Информация о подписании</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-xs text-muted-foreground">
							<p>• Подписание происходит через защищенное соединение</p>
							<p>• После подписания вы получите копию на email</p>
							<p>• Документ будет иметь отметку времени</p>
							<p>• Подписанный документ можно скачать в любое время</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}