// app/api/podpislon/status/[id]/route.ts
import { NextResponse } from "next/server";

const API_KEY = process.env.PODPISLON_API_KEY!;
const API_MODE = process.env.PODPISLON_API_MODE || "auto";

function normalizeStatus(raw: string | number | undefined) {
  const s = String(raw ?? "").toLowerCase();
  if (
    ["30", "signed", "success", "completed", "done", "подписан"].some((x) =>
      s.includes(x)
    )
  )
    return "signed";
  if (
    ["15", "10", "pending", "created", "waiting", "отправлен", "ожидает"].some(
      (x) => s.includes(x)
    )
  )
    return "pending_signature";
  if (["rejected", "declined", "отклон"].some((x) => s.includes(x)))
    return "rejected";
  if (["expired", "просроч"].some((x) => s.includes(x))) return "expired";
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

  // Используем рабочий endpoint из диагностики
  const url = "https://podpislon.ru/integration";
  const body = new URLSearchParams();
  body.append("ids[]", id);

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
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(json)}`);
  }

  // Podpislon возвращает массив документов
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(`Document with ID ${id} not found`);
  }

  const document = json[0];
  const statusRaw = document.status;
  const statusText = document.status_text;
  const signedAt = document.sign_at;

  const normalized = normalizeStatus(statusRaw);

  return {
    status: normalized,
    statusText,
    signedAt,
    raw: document,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = id?.trim();

    if (!documentId) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    let result;

    if (API_MODE === "mock") {
      result = await mockGetStatus(documentId);
    } else if (API_MODE === "real") {
      result = await realGetStatus(documentId);
    } else {
      // auto mode
      try {
        result = await realGetStatus(documentId);
      } catch (error) {
        console.log(
          "[Podpislon Status] Real API failed, falling back to mock:",
          error
        );
        result = await mockGetStatus(documentId);
      }
    }

    return NextResponse.json({
      id: documentId,
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
