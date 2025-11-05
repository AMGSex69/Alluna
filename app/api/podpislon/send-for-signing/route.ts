// /api/podpislon/send-for-signing/route.ts
import { updateDocumentStatus } from "@/lib/projects";
import { NextRequest, NextResponse } from "next/server";

const API_MODE = process.env.PODPISLON_API_MODE || "auto";

const PODPISLON_CONFIG = {
  baseUrl: "https://podpislon.ru",
  endpoint: "/integration/add-document",
};

// Мок-реализация для разработки
async function mockSendForSigning(body: any) {
  console.log("[Podpislon] Using MOCK implementation");

  await new Promise((resolve) => setTimeout(resolve, 800));

  const mockId = Math.floor(10000 + Math.random() * 90000);
  const mockSigningUrl = `https://podpislon.ru/sign/pack/${mockId}/mock123`;

  return {
    success: true,
    signing_id: mockId.toString(),
    contract_id: mockId.toString(),
    status: "sent",
    signing_url: mockSigningUrl,
    link: mockSigningUrl,
    message: "✅ Договор успешно создан и отправлен на email клиенту",
    provider: "podpislon",
  };
}

// Реальная реализация с улучшенной обработкой PDF
async function realSendForSigning(body: any) {
  const { baseUrl, endpoint } = PODPISLON_CONFIG;
  const apiUrl = `${baseUrl}${endpoint}`;
  const apiKey = process.env.PODPISLON_API_KEY;

  if (!apiKey) {
    throw new Error("PODPISLON_API_KEY is not configured");
  }

  const { document_id, document_name, signer, file_data } = body;

  // УЛУЧШЕННАЯ ПРОВЕРКА PDF - поддерживаем разные форматы
  if (!file_data) {
    throw new Error("file_data обязателен");
  }

  let base64Data = file_data;
  let isDataURL = false;

  // Проверяем разные форматы base64
  if (file_data.startsWith("data:application/pdf;base64,")) {
    base64Data = file_data.split(",")[1];
    isDataURL = true;
    console.log("[Podpislon] PDF format: Data URL with PDF base64");
  } else if (file_data.startsWith("data:application/pdf")) {
    base64Data = file_data.split(",")[1];
    isDataURL = true;
    console.log("[Podpislon] PDF format: Data URL");
  } else if (file_data.startsWith("data:")) {
    // Любой другой data URL
    base64Data = file_data.split(",")[1];
    isDataURL = true;
    console.log("[Podpislon] PDF format: Generic Data URL");
  } else {
    // Предполагаем что это чистый base64
    console.log("[Podpislon] PDF format: Raw base64");
  }

  // Проверяем что base64Data не пустой
  if (!base64Data) {
    throw new Error("file_data должен содержать валидные base64 данные");
  }

  // Проверяем что это валидный base64
  try {
    // Декодируем небольшую часть чтобы проверить валидность
    const testDecode = atob(base64Data.substring(0, 100));
    console.log("[Podpislon] Base64 validation: OK");
  } catch (error) {
    throw new Error(
      "file_data содержит невалидные base64 данные: " + error.message
    );
  }

  // Разбираем имя на составляющие
  const nameParts = (signer.name || "").split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) {
    throw new Error("signer.name must contain at least first and last name");
  }

  const lastName = nameParts[0];
  const firstName = nameParts[1];

  // Форматируем телефон
  const formatPhone = (phone: string): string => {
    if (!phone) throw new Error("Phone is required");

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10) {
      throw new Error("Phone number too short");
    }

    const cleanDigits = digits.slice(-10);
    return `+7${cleanDigits}`;
  };

  // Создаем FormData
  const formData = new FormData();

  try {
    // ОБЯЗАТЕЛЬНЫЕ ПОЛЯ
    formData.append("name", firstName);
    formData.append("last_name", lastName);
    formData.append("phone", formatPhone(signer.phone));
    formData.append("agreement", "1");
    formData.append("no_sms", "Y");

    // Файл документа
    console.log("[Podpislon] Processing PDF file...");

    // Конвертируем base64 в Blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });

    // Проверяем размер файла
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error("Размер файла превышает 10MB");
    }

    if (blob.size === 0) {
      throw new Error("PDF файл пустой");
    }

    // Создаем безопасное имя файла
    const safeFileName =
      document_name.replace(/[^a-zA-Z0-9а-яА-Я]/g, "_").slice(0, 100) + ".pdf";

    formData.append("file", blob, safeFileName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails = {};

      try {
        const errorData = JSON.parse(responseText);
        errorMessage += ` - ${
          errorData.message || errorData.error || JSON.stringify(errorData)
        }`;
        errorDetails = errorData;
      } catch {
        errorMessage += ` - ${responseText.substring(0, 200)}`;
        errorDetails = { raw: responseText.substring(0, 500) };
      }

      if (response.status === 400) {
        errorMessage = `Ошибка валидации данных: ${errorMessage}`;
      } else if (response.status === 401) {
        errorMessage = "Неверный API ключ Podpislon";
      } else if (response.status === 403) {
        errorMessage = "Доступ запрещен. Проверьте права API ключа";
      } else if (response.status === 429) {
        errorMessage = "Слишком много запросов. Попробуйте позже";
      }

      throw new Error(`Podpislon API Error: ${errorDetails}`);
    }

    // Обрабатываем успешный ответ
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(
        `Invalid JSON response from Podpislon: ${responseText.substring(
          0,
          200
        )}`
      );
    }

    console.log("[Podpislon] Response structure analysis:", {
      hasStatus: "status" in data,
      status: data.status,
      hasResult: "result" in data,
      resultKeys: data.result ? Object.keys(data.result) : "no result",
      hasFiles: data.result?.files?.length > 0,
      hasLinks: data.result?.links?.length > 0,
    });

    // Проверяем ожидаемую структуру ответа
    if (data.status === false || data.status === "error") {
      throw new Error(
        `Podpislon returned error: ${
          data.message || data.error || JSON.stringify(data)
        }`
      );
    }

    if (
      !data.result ||
      !data.result.links ||
      !data.result.links[0] ||
      !data.result.links[0].URL
    ) {
      throw new Error(
        `Missing signing URL in response: ${JSON.stringify(data)}`
      );
    }

    // Извлекаем данные из ответа
    const documentId = data.result.files[0].ID;
    const signingUrl = data.result.links[0].URL;

    console.log("[Podpislon] Document created successfully:");
    console.log("[Podpislon] - Document ID:", documentId);
    console.log("[Podpislon] - Signing URL:", signingUrl);

    if (data.result?.files?.[0]?.ID) {
  const signingId = data.result.files[0].ID.toString();

  const updateResult = await updateDocumentStatus(
    document_id, 
    'pending_signature', 
    {
      podpislon_id: signingId,
      sign_url: signingUrl,
      status_message: "Документ отправлен на подписание",
    }
  );
  
  console.log("[Podpislon] Database update result:", updateResult);
  
  if (!updateResult) {
    console.error("[Podpislon] FAILED to update document status in database");
  }
}

    return {
      success: true,
      signing_id: documentId.toString(),
      contract_id: documentId.toString(),
      status: "sent",
      signing_url: signingUrl,
      link: signingUrl,
      message: "Договор создан и отправлен на подписание",
      provider: "podpislon",
      raw_response: data,
    };
  } catch (error) {
    console.error("[Podpislon] API call failed:", error);

    if (error.name === "AbortError") {
      throw new Error("Timeout: Podpislon API не ответил в течение 30 секунд");
    }

    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("[Podpislon] === START Send for signing ===");
  console.log("[Podpislon] API Mode:", API_MODE);
  console.log("[Podpislon] Enviroment:", {
    hasApiKey: !!process.env.PODPISLON_API_KEY,
    apiKeyLength: process.env.PODPISLON_API_KEY?.length,
  });

  try {
    const body = await request.json();
    console.log("[Podpislon] Request body keys:", Object.keys(body));
    console.log("[Podpislon] Document ID:", body.document_id);
    console.log("]Podpislon] Document name:", body.document_name);
    console.log("[Podpislon] Signer:", body.signer);
    console.log("[Podpislon] file_data type:", typeof body.file_data);
    console.log("[Podpislon] file data length:", body.file_data?.length);
    console.log(
      "[Podpislon] file_data starts with:",
      body.file_data?.substring(0, 100)
    );

    // Валидация
    const { document_id, document_name, signer, file_data } = body;

    if (!document_id || !document_name) {
      return NextResponse.json(
        { error: "document_id and document_name are required" },
        { status: 400 }
      );
    }

    if (!signer?.name || !signer?.phone || !signer?.email) {
      return NextResponse.json(
        { error: "signer.name, signer.phone, and signer.email are required" },
        { status: 400 }
      );
    }

    if (!file_data) {
      return NextResponse.json(
        { error: "file_data is required" },
        { status: 400 }
      );
    }

    let result;

    if (API_MODE === "mock") {
      result = await mockSendForSigning(body);
    } else if (API_MODE === "real") {
      result = await realSendForSigning(body);
    } else {
      // auto mode
      try {
        result = await realSendForSigning(body);
      } catch (error) {
        console.log(
          "[Podpislon] Real API failed, falling back to mock:",
          error.message
        );
        result = await mockSendForSigning(body);
      }
    }

    console.log("[Podpislon] Success:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Podpislon] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send for signing",
        details: error instanceof Error ? error.message : String(error),
        provider: "podpislon",
      },
      { status: 500 }
    );
  } finally {
    console.log("[Podpislon] === END Send for signing ===");
  }
}
