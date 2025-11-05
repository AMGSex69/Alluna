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
  type: string;
  status?: string;
  file_url?: string | null;
  content?: string;
  podpislon_id?: string | null;
  sign_url?: mstring | null;
}): Promise<Document | null> {
  if (USE_MOCK_DATA) {
    return mockModule.createDocument(documentData);
  }

  try {
    console.log("[v0] Creating document with file_url:", documentData.file_url);

    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .insert({
        project_id: documentData.project_id,
        name: documentData.name,
        type: documentData.type,
        status: documentData.status || "draft",
        file_url: documentData.file_url || null,
        content: documentData.content || null,
        podpislon_id: documentData.podpislon_id || null,
        sign_url: documentData.sign_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating document:", error);
      return null;
    }

    return data as Document;
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
  status: string,
  additionalData?: {
    podpislon_id?: string;
    sign_url?: string;
    status_message?: string;
    signed_at?: string;
  }
): Promise<Document | null> {
  try {
    console.log("[updateDocumentStatus] Updating document:", {
      documentId,
      status,
      additionalData,
    });

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (additionalData?.podpislon_id) {
      updateData.podpislon_id = additionalData.podpislon_id;
      console.log("[updateDocumentStatus] Setting podpislon_id:", additionalData.podpislon_id);
    }

    if (additionalData?.sign_url) {
      updateData.sign_url = additionalData.sign_url;
      console.log("[updateDocumentStatus] Setting sign_url:", additionalData.sign_url);
    }

    if (additionalData?.status_message) {
      updateData.status_message = additionalData.status_message;
    }

    if (additionalData.signed_at) {
      updateData.signed_at = additionalData.signed_at;
    }

    console.log("[updateDocumentStatus] Final update data:", updateData);

    const { data, error } = await supabaseModule.supabase
      .from("documents")
      .update(updateData)
      .eq("id", documentId)
      .select("*")
      .single();

    if (error) {
      console.error("[updateDocumentStatus] Supabase error:", error);
      console.error("[updateDocumentStatus] Error details:", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      return null;
    }

    console.log("[updateDocumentStatus] Document updated successfully:", data);
    return data as Document;
  } catch (error) {
    console.error("[updateDocumentStatus] Unexpected error:", error);
    return null;
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
