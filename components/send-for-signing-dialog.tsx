"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, Mail, Phone, AlertCircle } from "lucide-react"

interface SendForSigningDialogProps {
	documentName: string
	clientPhone: string
	clientEmail?: string
	onSendForSigning: (phone: string, email?: string) => Promise<void>
	trigger?: React.ReactNode
}

export function SendForSigningDialog({
	documentName,
	clientPhone,
	clientEmail = "",
	onSendForSigning,
	trigger,
}: SendForSigningDialogProps) {
	const [open, setOpen] = useState(false)
	const [phone, setPhone] = useState(clientPhone)
	const [email, setEmail] = useState(clientEmail)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")

		if (!phone.trim()) {
			setError("Номер телефона обязателен")
			return
		}

		if (!email.trim()) {
			setError("Email обязателен для отправки документа")
			return
		}

		if (!validateEmail(email)) {
			setError("Некорректный формат email")
			return
		}

		setIsLoading(true)

		try {
			await onSendForSigning(phone, email)
			setOpen(false)
			setError("")
		} catch (error) {
			console.error("Error sending for signing:", error)
			setError("Произошла ошибка при отправке документа")
		} finally {
			setIsLoading(false)
		}
	}

	const formatPhone = (value: string) => {
		// Remove all non-digits
		const digits = value.replace(/\D/g, "")

		// Format as +7 (XXX) XXX-XX-XX
		if (digits.length >= 1) {
			if (digits.startsWith("8")) {
				return "+7 " + digits.slice(1).replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "($1) $2-$3-$4")
			} else if (digits.startsWith("7")) {
				return "+" + digits.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 ($2) $3-$4-$5")
			}
		}
		return value
	}

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatPhone(e.target.value)
		setPhone(formatted)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button size="sm" className="flex items-center gap-2">
						<Send className="h-4 w-4" />
						Отправить на подпись
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5 text-blue-600" />
						Отправить документ на подпись
					</DialogTitle>
					<DialogDescription>
						Документ "{documentName}" будет отправлен клиенту на email со ссылкой для подписания.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Alert className="border-blue-200 bg-blue-50">
							<Mail className="h-4 w-4 text-blue-600" />
							<AlertDescription className="text-blue-800">
								<strong>Email уведомления:</strong> Клиент получит письмо со ссылкой для подписания документа. SMS верификация не требуется.
							</AlertDescription>
						</Alert>

						<div className="grid gap-2">
							<Label htmlFor="phone">Номер телефона</Label>
							<div className="relative">
								<Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="phone"
									type="tel"
									placeholder="+7 (999) 123-45-67"
									value={phone}
									onChange={handlePhoneChange}
									className="pl-10"
									required
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="email">Email клиента *</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="client@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className={`pl-10 ${!validateEmail(email) && email ? 'border-red-500' : ''}`}
									required
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								На этот email будет отправлена ссылка для подписания
							</p>
						</div>

						<div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
							<h4 className="text-sm font-medium mb-2">Что произойдет:</h4>
							<ol className="text-sm text-muted-foreground space-y-1">
								<li>1. Документ будет создан в системе OkiDoki</li>
								<li>2. На email клиента придет письмо со ссылкой</li>
								<li>3. Клиент сможет просмотреть и подписать документ</li>
								<li>4. После подписания статус обновится автоматически</li>
							</ol>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Отмена
						</Button>
						<Button type="submit" disabled={isLoading || !email || !validateEmail(email)}>
							{isLoading ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
									Отправка...
								</>
							) : (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Отправить Email
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}