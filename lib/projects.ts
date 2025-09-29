// Check if we should use mock data (for testing without Supabase)
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// Import appropriate modules based on mode
let mockModule: any = null;
let supabaseModule: any = null;

if (USE_MOCK_DATA) {
  console.log("[Projects] Using mock data mode");
  mockModule = require("./mock-data");
} else {
  console.log("[Projects] Using Supabase mode");
  supabaseModule = require("./supabase/client");
}

import type { Project, Document } from "./supabase/client";

// Project CRUD operations
export async function createProject(projectData: {
  name: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  description?: string;
}): Promise<Project | null> {
  if (USE_MOCK_DATA) {
    return mockModule.createProject(projectData);
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();

    if (error) {
      if (error.message.includes("Could not find the table")) {
        console.warn(
          "Projects table not found. Please run the database setup script."
        );
        return null;
      }
      console.error("Error creating project:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating project:", error);
    return null;
  }
}

export async function getProjects(): Promise<Project[]> {
  if (USE_MOCK_DATA) {
    return mockModule.getProjects();
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("Could not find the table")) {
        console.warn(
          "Projects table not found. Please run the database setup script."
        );
        return [];
      }
      console.error("Error fetching projects:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getProject(id: string): Promise<Project | null> {
  if (USE_MOCK_DATA) {
    return mockModule.getProject(id);
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    return mockModule.deleteProject(id);
  }

  try {
    // First delete all documents associated with the project
    const { error: documentsError } = await supabaseModule.supabase
      .from("documents")
      .delete()
      .eq("project_id", id);

    if (documentsError) {
      console.error("Error deleting project documents:", documentsError);
      return false;
    }

    // Then delete the project
    const { error } = await supabaseModule.supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.message.includes("Could not find the table")) {
        console.warn(
          "Projects table not found. Please run the database setup script."
        );
        return false;
      }
      console.error("Error deleting project:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    return false;
  }
}

// Document CRUD operations
export async function getProjectDocuments(
  projectId: string
): Promise<Document[]> {
  if (USE_MOCK_DATA) {
    return mockModule.getProjectDocuments(projectId);
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

export async function createDocument(documentData: {
  project_id: string;
  name: string;
  type: "contract" | "act" | "attachment" | "agreement" | "invoice" | "other";
  status?: "draft" | "pending_signature" | "signed";
  file_url?: string;
  content?: string;
}): Promise<Document | null> {
  if (USE_MOCK_DATA) {
    return mockModule.createDocument({
      project_id: documentData.project_id,
      name: documentData.name,
      type: documentData.type,
      file_url: documentData.file_url,
    });
  }

  try {
    console.log("[v0] Creating document with file_url:", documentData.file_url);

    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating document:", error);
    return null;
  }
}

export async function getDocument(id: string): Promise<Document | null> {
  if (USE_MOCK_DATA) {
    return mockModule.getDocument(id);
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}

export async function updateDocumentStatus(
  documentId: string,
  status: "draft" | "pending_signature" | "signed"
): Promise<boolean> {
  if (USE_MOCK_DATA) {
    return mockModule.updateDocumentStatus(documentId, status);
  }

  try {
    const { error } = await supabaseModule.supabase
      .from("documents")
      .update({
        status,
        signed_at: status === "signed" ? new Date().toISOString() : null,
      })
      .eq("id", documentId);

    if (error) {
      console.error("Error updating document status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating document status:", error);
    return false;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    return mockModule.deleteDocument(id);
  }

  try {
    const { error } = await supabaseModule.supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
}

export const getDocumentsCountForAllProjects = async (): Promise<
  Record<string, number>
> => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    // Mock данные
    return {
      "1": 3,
      "2": 1,
      "3": 5,
    };
  }

  try {
    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .select("project_id");

    if (error) {
      console.error("Error fetching documents:", error);
      // Если таблицы documents не существует, возвращаем пустой объект
      if (
        error.code === "42P01" ||
        error.message.includes("Could not find the table")
      ) {
        console.warn(
          "Documents table does not exist yet, returning empty counts"
        );
        return {};
      }
      return {};
    }

    if (!data) return {};

    // Группируем документы по project_id и подсчитываем количество
    const counts = data.reduce((acc, document) => {
      const projectId = document.project_id;
      acc[projectId] = (acc[projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return counts;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {};
  }
};
