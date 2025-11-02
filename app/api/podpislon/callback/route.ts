// /api/podpislon/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Получаем сырые данные в формате x-www-form-urlencoded
    const formData = await request.text();
    console.log("[Podpislon] Callback raw data:", formData);

    // Парсим form-data
    const params = new URLSearchParams(formData);
    
    const event = params.get('EVENT');
    const fileId = params.get('FILE_ID');
    const companyId = params.get('COMPANY_ID');
    const signature = params.get('SIGNATURE');
    const contact = params.get('CONTACT');

    console.log("[Podpislon] Parsed callback data:", {
      event,
      fileId,
      companyId,
      signature,
      contact
    });

    // Валидация обязательных полей
    if (!event || !fileId || !companyId || !signature) {
      console.error("[Podpislon] Missing required fields");
      return NextResponse.json(
        { ok: false, mess: "Missing required fields: EVENT, FILE_ID, COMPANY_ID, SIGNATURE" },
        { status: 400 }
      );
    }

    // TODO: Проверить подпись (SIGNATURE) для безопасности
    // const isValidSignature = verifySignature(signature, fileId, companyId);
    // if (!isValidSignature) {
    //   return NextResponse.json({ ok: false, mess: "Invalid signature" }, { status: 401 });
    // }

    // Обрабатываем события
    let internalStatus = "unknown";
    let statusMessage = "";

    switch (event) {
      case 'DOCUMENT_OPENED':
        internalStatus = "viewed";
        statusMessage = `Документ просмотрен клиентом`;
        if (contact) {
          statusMessage += `, телефон: ${contact}`;
        }
        break;
        
      case 'DOCUMENT_SIGNED':
        internalStatus = "signed";
        statusMessage = "Документ успешно подписан";
        break;
        
      default:
        internalStatus = "unknown_event";
        statusMessage = `Неизвестное событие: ${event}`;
    }

    console.log(`[Podpislon] Updating document ${fileId} to status: ${internalStatus}`);

    // TODO: Обновить статус документа в вашей базе данных
    // await updateDocumentStatus(fileId, internalStatus, statusMessage);
    const updateSuccess = await updateDocumentStatus(fileId, internalStatus, statusMessage);

    if (!updateSuccess) {
      console.error("[Podpislon] Failed to update document status");
      return NextResponse.json(
        { ok: false, mess: "Failed to update document status" },
        { status: 500 }
      );
    }

    console.log("[Podpislon] Callback processed successfully");

    // Возвращаем ответ в формате из документации Podpislon
    return NextResponse.json({ 
      ok: true, 
      mess: "Callback processed successfully" 
    });

  } catch (error) {
    console.error("[Podpislon] Callback error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        mess: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}

// Временная функция для обновления статуса документа
async function updateDocumentStatus(fileId: string, status: string, message: string): Promise<boolean> {
  try {
    console.log(`[Podpislon] Updating document ${fileId}: ${status} - ${message}`);
    
    // TODO: Замените эту логику на реальное обновление в вашей БД
    // Пример:
    // await db.documents.update({
    //   where: { external_id: fileId },
    //   data: { 
    //     status: status,
    //     status_message: message,
    //     updated_at: new Date()
    //   }
    // });
    
    return true;
  } catch (error) {
    console.error('[Podpislon] Error updating document status:', error);
    return false;
  }
}