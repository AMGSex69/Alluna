"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileText, Home, Trash2, LogOut, Plus } from "lucide-react"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import {
  getProjects,
  createProject,
  deleteProject,
  getDocumentsCountForAllProjects,
} from "@/lib/projects"
import type { Project } from "@/lib/supabase/client"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"

function HomeContent() {
  const [projects, setProjects] = useState<Project[]>([])
  const [documentsCount, setDocumentsCount] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(false)
  const { user, signOut } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      console.log("Loading projects from database...")
      const projectsData = await getProjects()
      console.log("Projects loaded:", projectsData.length)

      setProjects(projectsData)
      setProjectsError(false)

      // Load documents count
      try {
        const counts = await getDocumentsCountForAllProjects()
        setDocumentsCount(counts)
      } catch (docError) {
        console.error("Error loading documents count:", docError)
        const emptyCounts: Record<string, number> = {}
        projectsData.forEach((project) => {
          emptyCounts[project.id] = 0
        })
        setDocumentsCount(emptyCounts)
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      setProjectsError(true)
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
      console.log("Creating project:", projectData)
      const newProject = await createProject({
        name: projectData.name,
        client_name: projectData.client,
        client_phone: projectData.clientPhone,
        client_email: projectData.clientEmail,
        description: projectData.description,
      })

      if (newProject) {
        console.log("Project created successfully:", newProject.id)
        setProjects((prev) => [newProject, ...prev])
        setDocumentsCount((prev) => ({
          ...prev,
          [newProject.id]: 0,
        }))
        setProjectsError(false)
      } else {
        console.log("Failed to create project - database not ready")
        setProjectsError(true)
      }
    } catch (error) {
      console.error("Error creating project:", error)
      setProjectsError(true)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  const handleDeleteProject = async (
    projectId: string,
    projectName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()

    if (
      confirm(
        `Вы уверены, что хотите удалить проект "${projectName}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        console.log("Deleting project:", projectId)
        const success = await deleteProject(projectId)

        if (success) {
          console.log("Project deleted successfully")
          setProjects((prev) => prev.filter((p) => p.id !== projectId))
          setDocumentsCount((prev) => {
            const newCounts = { ...prev }
            delete newCounts[projectId]
            return newCounts
          })
        } else {
          console.log("Failed to delete project")
          alert("Не удалось удалить проект. Попробуйте еще раз.")
        }
      } catch (error) {
        console.error("Error deleting project:", error)
        alert("Произошла ошибка при удалении проекта.")
      }
    }
  }

  const getProjectDocumentsCount = (projectId: string): number => {
    return documentsCount[projectId] || 0
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
              <Home className="h-6 w-6 text-gray-900 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">ALLUNA</h1>
              <p className="ml-4 text-sm text-gray-600 hidden sm:block">
                Управление дизайн-проектами интерьеров
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user?.email}
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.email?.[0]?.toUpperCase() || "П"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Проекты</h2>
            <p className="text-gray-600 mt-2">
              Управление вашими дизайн-проектами и документами
            </p>
          </div>
          <CreateProjectDialog onCreateProject={handleCreateProject} />
        </div>

        {projectsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Ошибка загрузки проектов. Пожалуйста, проверьте подключение к базе данных.
            </AlertDescription>
          </Alert>
        )}

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Проектов пока нет
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Создайте ваш первый проект, чтобы начать работу с документами.
              </p>
              <CreateProjectDialog onCreateProject={handleCreateProject} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"


onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{project.client_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Документов:</span>
                      <span className="font-medium">
                        {getProjectDocumentsCount(project.id)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Телефон:</span>
                      <span className="font-medium">{project.client_phone}</span>
                    </div>
                    {project.client_email && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Email:</span>
                        <span className="font-medium">{project.client_email}</span>
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  )
}