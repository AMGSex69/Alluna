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
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface CreateProjectDialogProps {
	onCreateProject: (project: {
		name: string
		client: string
		description: string
		clientPhone: string
		clientEmail?: string
	}) => Promise<void>
}

export function CreateProjectDialog({ onCreateProject }: CreateProjectDialogProps) {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [formData, setFormData] = useState({
		name: "",
		client: "",
		description: "",
		clientPhone: "",
		clientEmail: "",
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (formData.name && formData.client) {
			setLoading(true)
			try {
				await onCreateProject(formData)
				setFormData({
					name: "",
					client: "",
					description: "",
					clientPhone: "",
					clientEmail: "",
				})
				setOpen(false)
			} catch (error) {
				console.error("Error creating project:", error)
			} finally {
				setLoading(false)
			}
		}
	}

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					ДОБАВИТЬ ПРОЕКТ
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Создать новый проект</DialogTitle>
					<DialogDescription>Заполните информацию о новом дизайн-проекте интерьера</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Название проекта *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => handleInputChange("name", e.target.value)}
								placeholder="Например: Квартира на Арбате"
								required
								disabled={loading}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="client">Имя клиента *</Label>
							<Input
								id="client"
								value={formData.client}
								onChange={(e) => handleInputChange("client", e.target.value)}
								placeholder="Например: Иванов Иван Иванович"
								required
								disabled={loading}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="clientPhone">Телефон клиента</Label>
							<Input
								id="clientPhone"
								type="tel"
								value={formData.clientPhone}
								onChange={(e) => handleInputChange("clientPhone", e.target.value)}
								placeholder="+7 (999) 123-45-67"
								disabled={loading}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="clientEmail">Email клиента *</Label>
							<Input
								id="clientEmail"
								type="email"
								value={formData.clientEmail}
								onChange={(e) => handleInputChange("clientEmail", e.target.value)}
								placeholder="client@example.com"
								required
								disabled={loading}
							/>
							<p className="text-xs text-muted-foreground">
								На этот email будут отправляться документы для подписания
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Описание проекта</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => handleInputChange("description", e.target.value)}
								placeholder="Краткое описание проекта..."
								rows={3}
								disabled={loading}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
							Отмена
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Создание..." : "Создать проект"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
