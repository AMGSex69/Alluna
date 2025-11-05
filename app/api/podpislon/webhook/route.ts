// app/api/podpislon/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateDocumentStatus } from "@/lib/projects";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("[Podpislon Webhook] Received:", body);

    const { document_id, status, signed_at } = body;

    if (!document_id) {
      return NextResponse.json({ error: "document_id is required" }, { status: 400 });
    }

    // Обновляем статус в БД
    if (status === "signed" || status === "30") {
      await updateDocumentStatus(document_id, "signed", {
        signed_at: signed_at || new Date().toISOString(),
        status_message: "Документ подписан через вебхук",
      });
      console.log(`[Webhook] Document ${document_id} marked as signed`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Podpislon Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}