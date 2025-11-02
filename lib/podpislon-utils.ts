// lib/podpislon-utils.ts
import { generateSimplePDF } from "./simple-pdf-generator";

export interface PDFData {
  documentName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  projectName?: string;
}

/**
 * Генерирует PDF документ для подписания
 */
export async function generateDocumentPDF(data: PDFData): Promise<string> {
  try {
    console.log("Generating PDF with data:", data);

    // Используем simple PDF генератор
    const pdf = await generateSimplePDF(data);

    if (!pdf || !pdf.startsWith("data:application/pdf;base64,")) {
      console.error("Invalid PDF format received:", pdf?.substring(0, 100));
      throw new Error("PDF generation returned invalid format");
    }

    console.log("PDF generated successfully, length:", pdf.length);
    return pdf;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Конвертирует файл в base64 data URL для отправки в API
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (!result.startsWith("data:application/pdf;base64,")) {
        reject(new Error("File is not a PDF or has incorrect format"));
        return;
      }
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Проверяет и форматирует телефон согласно требованиям Podpislon
 */
export function formatPhoneForPodpislon(phone: string): string {
  if (!phone) throw new Error("Phone is required");

  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    return "+7" + digits.slice(1);
  } else if (digits.length === 11 && digits.startsWith("7")) {
    return "+" + digits;
  } else if (digits.length === 10) {
    return "+7" + digits;
  }

  throw new Error(
    `Invalid phone format: ${phone}. Expected formats: +7 XXX XXX-XX-XX, 8 XXX XXX-XX-XX, etc.`
  );
}

/**
 * Разбирает полное имя на компоненты для Podpislon
 */
export function splitNameForPodpislon(fullName: string): {
  firstName: string;
  lastName: string;
  middleName?: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    throw new Error("Name must contain at least first and last name");
  }

  return {
    lastName: parts[0], // Фамилия
    firstName: parts[1], // Имя
    middleName: parts.slice(2).join(" "), // Отчество (необязательно)
  };
}
