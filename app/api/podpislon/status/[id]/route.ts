// app/api/podpislon/status/[id]/route.ts
import { NextResponse } from "next/server";
import { updateDocumentStatus } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

const API_KEY = process.env.PODPISLON_API_KEY!;
const API_MODE = process.env.PODPISLON_API_MODE || "auto";

// Улучшенная функция нормализации статусов
function normalizeStatus(raw: string | number | undefined): "draft" | "pending_signature" | "signed" | "unknown" {
  if (!raw) return "unknown";
  
  const s = String(raw).toLowerCase().trim();
  
  // Подписанные статусы
  if (["30", "signed", "success", "completed", "done", "подписан", "успешно"].some((x) => s.includes(x))) {
    return "signed";
  }
  
  // Отправленные на подпись статусы
  if (["15", "10", "pending", "created", "waiting", "отправлен", "ожидает", "на подписании", "в процессе"].some((x) => s.includes(x))) {
    return "pending_signature";
  }
  
  // Черновики и созданные
  if (["5", "draft", "черновик", "создан"].some((x) => s.includes(x))) {
    return "draft";
  }
  
  // Отклоненные
  if (["rejected", "declined", "отклонен", "отказано"].some((x) => s.includes(x))) {
    return "draft"; // Возвращаем в черновик если отклонено
  }
  
  // Просроченные
  if (["expired", "просрочен", "истек"].some((x) => s.includes(x))) {
    return "draft";
  }
  
  return "unknown";
}

// Мок-функция для получения статуса
async function mockGetStatus(id: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const statuses = ["pending_signature", "signed", "pending_signature"];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    status: randomStatus,
    statusText:
      randomStatus === "signed" ? "Документ подписан" : "Ожидает подписания",
    signedAt: randomStatus === "signed" ? new Date().toISOString() : null,
  };
}

// Реальная функция для получения статуса
async function realGetStatus(id: string) {
  if (!API_KEY) {
    throw new Error("PODPISLON_API_KEY not configured");
  }

  try {
    const url = "https://podpislon.ru/integration";
    const body = new URLSearchParams();
    body.append("ids[]", id);

    console.log(`[Podpislon Status] Checking status for document: ${id}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    const text = await response.text();
    let json: any;

    try {
      json = JSON.parse(text);
    } catch {
      console.error("[Podpislon Status] Invalid JSON response:", text.substring(0, 200));
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error("[Podpislon Status] API error:", json);
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
    }

    // Podpislon возвращает массив документов
    if (!Array.isArray(json) || json.length === 0) {
      console.warn("[Podpislon Status] Document not found in response");
      throw new Error(`Document with ID ${id} not found`);
    }

    const document = json[0];
    const statusRaw = document.status;
    const statusText = document.status_text;
    const signedAt = document.sign_at;

    console.log("[Podpislon Status] Raw response:", {
      id,
      statusRaw,
      statusText,
      signedAt,
      document
    });

    const normalized = normalizeStatus(statusRaw);

    console.log(`[Podpislon Status] Normalized status: ${statusRaw} -> ${normalized}`);

    return {
      status: normalized,
      statusText,
      signedAt,
      raw: document,
    };
  } catch (error) {
    console.error("[Podpislon Status] API call failed:", error);
    throw error;
  }
}

// Функция для поиска документа по podpislon_id и обновления его статуса
async function updateDocumentStatusByPodpislonId(podpislonId: string, newStatus: string, signedAt?: string | null) {
  try {
    const supabase = await createClient();
    
    // Сначала находим документ по podpislon_id
    const { data: document, error: findError } = await supabase
      .from('documents')
      .select('id, status, name')
      .eq('podpislon_id', podpislonId)
      .single();

    if (findError) {
      console.error(`[Status Update] Document not found for podpislon_id ${podpislonId}:`, findError);
      return null;
    }

    if (!document) {
      console.warn(`[Status Update] No document found with podpislon_id: ${podpislonId}`);
      return null;
    }

    console.log(`[Status Update] Found document: ${document.id} (${document.name}), current status: ${document.status}, new status: ${newStatus}`);

    // Если статус не изменился, не обновляем
    if (document.status === newStatus) {
      console.log(`[Status Update] Status unchanged for document ${document.id}, skipping update`);
      return document;
    }

    // Обновляем статус документа
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "signed" && signedAt) {
      updateData.signed_at = signedAt;
    }

    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', document.id)
      .select('*')
      .single();

    if (updateError) {
      console.error(`[Status Update] Error updating document ${document.id}:`, updateError);
      return null;
    }

    console.log(`[Status Update] Successfully updated document ${document.id} from ${document.status} to ${newStatus}`);
    return updatedDocument;
  } catch (error) {
    console.error(`[Status Update] Unexpected error for podpislon_id ${podpislonId}:`, error);
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const podpislonId = id?.trim();

    if (!podpislonId) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    let result;

    if (API_MODE === "mock") {
      result = await mockGetStatus(podpislonId);
    } else if (API_MODE === "real") {
      result = await realGetStatus(podpislonId);
    } else {
      // auto mode
      try {
        result = await realGetStatus(podpislonId);
      } catch (error) {
        console.log(
          "[Podpislon Status] Real API failed, falling back to mock:",
          error
        );
        result = await mockGetStatus(podpislonId);
      }
    }

    // ВСЕГДА обновляем статус в БД, если он известен и отличается
    if (result.status !== "unknown") {
      console.log(`[Podpislon Status] Updating document status in DB for podpislon_id ${podpislonId}: ${result.status}`);
      
      const updatedDocument = await updateDocumentStatusByPodpislonId(
        podpislonId, 
        result.status, 
        result.signedAt
      );

      if (updatedDocument) {
        console.log(`[Podpislon Status] DB update successful for document ${updatedDocument.id}`);
      } else {
        console.warn(`[Podpislon Status] DB update failed for podpislon_id ${podpislonId}`);
      }
    } else {
      console.warn(`[Podpislon Status] Unknown status for podpislon_id ${podpislonId}, skipping DB update`);
    }

    return NextResponse.json({
      id: podpislonId,
      ...result,
    });
  } catch (e: any) {
    console.error("[Podpislon Status] Error:", e);
    return NextResponse.json(
      {
        error: "Failed to get document status",
        details: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}