import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[OkiDoki] Callback received:", body);

    // Handle OkiDoki callback for document status changes
    const { external_id, status, _id } = body;

    if (!external_id) {
      return NextResponse.json(
        { error: "external_id is required" },
        { status: 400 }
      );
    }

    console.log("[OkiDoki] Processing callback for document:", external_id);
    console.log("[OkiDoki] New status:", status);
    console.log("[OkiDoki] Contract ID:", _id);

    // Here you would typically update the document status in your database
    // For now, we'll just log the callback

    // Map OkiDoki status to our internal status
    let internalStatus = "draft";
    if (status?.name) {
      switch (status.name) {
        case "Выставлен":
          internalStatus = "pending_signature";
          break;
        case "Подписан":
          internalStatus = "signed";
          break;
        case "Отклонен":
        case "Аннулирован":
          internalStatus = "draft";
          break;
        default:
          internalStatus = "pending_signature";
      }
    }

    console.log("[OkiDoki] Mapped internal status:", internalStatus);

    // TODO: Update document status in database
    // await updateDocumentStatus(external_id, internalStatus)
    const success = await updateDocumentStatus(external_id, internalStatus);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update document status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
      external_id,
      status: internalStatus,
    });
  } catch (error) {
    console.error("[OkiDoki] Callback error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
