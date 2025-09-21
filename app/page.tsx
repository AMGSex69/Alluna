"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Home, AlertCircle, Trash2 } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { getProjects, createProject, deleteProject } from "@/lib/projects"
import type { Project } from "@/lib/supabase/client"

export default function HomePage() {
	const [projects, setProjects] = useState<Project[]>([])
	const [loading, setLoading] = useState(true)
	const [dbError, setDbError] = useState(false)
	const router = useRouter()
	const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

	useEffect(() => {
		loadProjects()
	}, [])

	const loadProjects = async () => {
		try {
			console.log("[v0] Loading projects from database...")
			const projectsData = await getProjects()
			console.log("[v0] Projects loaded:", projectsData.length)
			setProjects(projectsData)
			setDbError(false)
		} catch (error) {
			console.error("[v0] Error loading projects:", error)
			setDbError(true)
		} finally {
			setLoading(false)
		}
	}

	const handleCreateProject = async (projectData: {
		name: string
		client: string
		description: string
		clientPhone: string
		clientEmail?: string
	}) => {
		try {
			console.log("[v0] Creating project:", projectData)
			const newProject = await createProject({
				name: projectData.name,
				client_name: projectData.client,
				client_phone: projectData.clientPhone,
				client_email: projectData.clientEmail,
				description: projectData.description,
			})

			if (newProject) {
				console.log("[v0] Project created successfully:", newProject.id)
				setProjects((prev) => [newProject, ...prev])
				setDbError(false)
			} else {
				console.log("[v0] Failed to create project - database not ready")
				setDbError(true)
			}
		} catch (error) {
			console.error("[v0] Error creating project:", error)
			setDbError(true)
		}
	}

	const handleProjectClick = (projectId: string) => {
		router.push(`/project/${projectId}`)
	}

	const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
		e.stopPropagation() // Prevent card click

		if (confirm(`Вы уверены, что хотите удалить проект "${projectName}"? Это действие нельзя отменить.`)) {
			try {
				console.log("[v0] Deleting project:", projectId)
				const success = await deleteProject(projectId)

				if (success) {
					console.log("[v0] Project deleted successfully")
					setProjects((prev) => prev.filter((p) => p.id !== projectId))
				} else {
					console.log("[v0] Failed to delete project")
					alert("Не удалось удалить проект. Попробуйте еще раз.")
				}
			} catch (error) {
				console.error("[v0] Error deleting project:", error)
				alert("Произошла ошибка при удалении проекта.")
			}
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
					<p className="text-gray-600">Загрузка проектов...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-bold text-gray-900">ALLUNA</h1>
							<p className="ml-4 text-sm text-gray-600 hidden sm:block">Управление дизайн-проектами интерьеров</p>
						</div>
						<div className="flex items-center space-x-4">
							<div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
								<span className="text-sm font-medium text-gray-700">Д</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Mode indicator */}
			{useMockData && (
				<div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded">
					<div className="flex">
						<AlertCircle className="h-5 w-5 text-blue-400" />
						<div className="ml-3">
							<p className="text-sm text-blue-700">
								<strong>Режим тестирования:</strong> Приложение использует тестовые данные (без Supabase).
								Интегрирована поддержка OkiDoki API для Email подписания документов.
								<br />Для включения Supabase удалите <code>NEXT_PUBLIC_USE_MOCK_DATA=true</code> из .env.local
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Database Setup Warning */}
			{!useMockData && dbError && (
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded">
					<div className="flex">
						<AlertCircle className="h-5 w-5 text-yellow-400" />
						<div className="ml-3">
							<p className="text-sm text-yellow-700">
								<strong>Требуется настройка базы данных:</strong> Пожалуйста, выполните SQL скрипт для создания таблиц.
								Перейдите в настройки проекта и запустите скрипт <code>scripts/001_create_projects_table.sql</code>
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Projects Section */}
				<div className="mb-8">
					<div className="flex justify-between items-center mb-6">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">ПРОЕКТЫ</h2>
							<p className="text-sm text-gray-600 mt-1">Управляйте своими дизайн-проектами и документами</p>
						</div>
						<CreateProjectDialog onCreateProject={handleCreateProject} />
					</div>

					{/* Projects Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{projects.map((project) => (
							<Card
								key={project.id}
								className="hover:shadow-md transition-shadow cursor-pointer relative group"
								onClick={() => handleProjectClick(project.id)}
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2">
											<Home className="h-5 w-5 text-gray-600" />
											<CardTitle className="text-lg">{project.name}</CardTitle>
										</div>
										<button
											onClick={(e) => handleDeleteProject(project.id, project.name, e)}
											className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
											title="Удалить проект"
										>
											<Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
										</button>
									</div>
									<CardDescription className="text-sm">Клиент: {project.client_name}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between text-sm text-gray-600">
										<div className="flex items-center gap-1">
											<FileText className="h-4 w-4" />
											<span>0 документов</span>
										</div>
										<span>Создан: {new Date(project.created_at).toLocaleDateString("ru-RU")}</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Empty State */}
					{projects.length === 0 && !dbError && (
						<div className="text-center py-12">
							<Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет проектов</h3>
							<p className="text-gray-600 mb-6">Создайте свой первый дизайн-проект для начала работы</p>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
