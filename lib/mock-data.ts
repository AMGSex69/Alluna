// Mock data for testing without Supabase
import type { Project, Document } from "./supabase/client"

// Mock projects data
let mockProjects: Project[] = [
	{
		id: "1",
		name: "Квартира на Арбате",
		client_name: "Иван Иванович Петров",
		client_phone: "+7 (999) 123-45-67",
		client_email: "ivan.petrov@example.com",
		description: "Дизайн 3-комнатной квартиры в центре Москвы",
		created_at: "2024-01-15T10:00:00Z",
		updated_at: "2024-01-15T10:00:00Z",
	},
	{
		id: "2",
		name: "Офис IT-компании",
		client_name: "Анна Сергеевна Кузнецова",
		client_phone: "+7 (999) 987-65-43",
		client_email: "anna.kuznetsova@techcompany.com",
		description: "Современный офис для стартапа в сфере IT",
		created_at: "2024-01-10T14:30:00Z",
		updated_at: "2024-01-10T14:30:00Z",
	},
	{
		id: "3",
		name: "Загородный дом",
		client_name: "Михаил Александрович Волков",
		client_phone: "+7 (999) 555-12-34",
		client_email: "mikhail.volkov@email.ru",
		description: "Интерьер загородного дома в классическом стиле",
		created_at: "2024-01-08T09:15:00Z",
		updated_at: "2024-01-08T09:15:00Z",
	},
]

// Mock documents data
let mockDocuments: Document[] = [
	{
		id: "doc-1",
		project_id: "1",
		name: "Договор на дизайн-проект №ДП-001",
		type: "contract",
		status: "draft",
		file_url: "/api/documents/doc-1",
		created_at: "2024-01-15T10:30:00Z",
		updated_at: "2024-01-15T10:30:00Z",
	},
	{
		id: "doc-2",
		project_id: "1",
		name: "Техническое задание",
		type: "attachment",
		status: "draft",
		file_url: "/api/documents/doc-2",
		created_at: "2024-01-15T11:00:00Z",
		updated_at: "2024-01-15T11:00:00Z",
	},
	{
		id: "doc-3",
		project_id: "2",
		name: "Договор на дизайн офиса №ДП-002",
		type: "contract",
		status: "pending_signature",
		file_url: "/api/documents/doc-3",
		created_at: "2024-01-10T15:00:00Z",
		updated_at: "2024-01-10T15:00:00Z",
	},
	{
		id: "doc-4",
		project_id: "3",
		name: "Договор на дизайн дома №ДП-003",
		type: "contract",
		status: "signed",
		file_url: "/api/documents/doc-4",
		created_at: "2024-01-08T10:00:00Z",
		updated_at: "2024-01-08T10:00:00Z",
	},
]

// Helper function to generate IDs
function generateId(): string {
	return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

// Mock CRUD operations for Projects
export async function createProject(projectData: {
	name: string
	client_name: string
	client_phone: string
	client_email?: string
	description?: string
}): Promise<Project | null> {
	try {
		console.log("[Mock] Creating project:", projectData)

		const newProject: Project = {
			id: generateId(),
			name: projectData.name,
			client_name: projectData.client_name,
			client_phone: projectData.client_phone,
			client_email: projectData.client_email || "",
			description: projectData.description || "",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		mockProjects.unshift(newProject)
		console.log("[Mock] Project created successfully:", newProject.id)
		return newProject
	} catch (error) {
		console.error("[Mock] Error creating project:", error)
		return null
	}
}

export async function getProjects(): Promise<Project[]> {
	try {
		console.log("[Mock] Fetching projects...")
		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 100))
		console.log("[Mock] Projects fetched:", mockProjects.length)
		return [...mockProjects]
	} catch (error) {
		console.error("[Mock] Error fetching projects:", error)
		return []
	}
}

export async function getProject(id: string): Promise<Project | null> {
	try {
		console.log("[Mock] Fetching project:", id)
		const project = mockProjects.find(p => p.id === id)
		console.log("[Mock] Project found:", !!project)
		return project || null
	} catch (error) {
		console.error("[Mock] Error fetching project:", error)
		return null
	}
}

export async function deleteProject(id: string): Promise<boolean> {
	try {
		console.log("[Mock] Deleting project:", id)
		const index = mockProjects.findIndex(p => p.id === id)
		if (index !== -1) {
			mockProjects.splice(index, 1)
			// Also delete associated documents
			mockDocuments = mockDocuments.filter(d => d.project_id !== id)
			console.log("[Mock] Project deleted successfully")
			return true
		}
		return false
	} catch (error) {
		console.error("[Mock] Error deleting project:", error)
		return false
	}
}

// Mock CRUD operations for Documents
export async function createDocument(documentData: {
	project_id: string
	name: string
	type: string
	file_url?: string
}): Promise<Document | null> {
	try {
		console.log("[Mock] Creating document:", documentData)

		const newDocument: Document = {
			id: generateId(),
			project_id: documentData.project_id,
			name: documentData.name,
			type: documentData.type,
			status: "draft",
			file_url: documentData.file_url || `/api/documents/${generateId()}`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		mockDocuments.unshift(newDocument)
		console.log("[Mock] Document created successfully:", newDocument.id)
		return newDocument
	} catch (error) {
		console.error("[Mock] Error creating document:", error)
		return null
	}
}

export async function getProjectDocuments(projectId: string): Promise<Document[]> {
	try {
		console.log("[Mock] Fetching documents for project:", projectId)
		const documents = mockDocuments.filter(d => d.project_id === projectId)
		console.log("[Mock] Documents fetched:", documents.length)
		return [...documents]
	} catch (error) {
		console.error("[Mock] Error fetching documents:", error)
		return []
	}
}

export async function getDocument(id: string): Promise<Document | null> {
	try {
		console.log("[Mock] Fetching document:", id)
		const document = mockDocuments.find(d => d.id === id)
		console.log("[Mock] Document found:", !!document)
		return document || null
	} catch (error) {
		console.error("[Mock] Error fetching document:", error)
		return null
	}
}

export async function updateDocumentStatus(id: string, status: string): Promise<boolean> {
	try {
		console.log("[Mock] Updating document status:", id, status)
		const document = mockDocuments.find(d => d.id === id)
		if (document) {
			document.status = status
			document.updated_at = new Date().toISOString()
			console.log("[Mock] Document status updated successfully")
			return true
		}
		return false
	} catch (error) {
		console.error("[Mock] Error updating document status:", error)
		return false
	}
}

export async function deleteDocument(id: string): Promise<boolean> {
	try {
		console.log("[Mock] Deleting document:", id)
		const index = mockDocuments.findIndex(d => d.id === id)
		if (index !== -1) {
			mockDocuments.splice(index, 1)
			console.log("[Mock] Document deleted successfully")
			return true
		}
		return false
	} catch (error) {
		console.error("[Mock] Error deleting document:", error)
		return false
	}
}
