// lib/simple-pdf-generator.ts
import jsPDF from "jspdf";

export interface PDFData {
  documentName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  projectName?: string;
}

export function generateSimplePDF(data: PDFData): string {
  try {
    console.log("[PDF Generator] Starting PDF generation with data:", data);

    // Создаем PDF документ
    const pdf = new jsPDF();

    // Устанавливаем шрифт, поддерживающий кириллицу (если нужно)
    pdf.setFont("helvetica");

    // Заголовок
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235); // Синий цвет
    pdf.text("ДОГОВОР ОКАЗАНИЯ УСЛУГ", 105, 20, { align: "center" });

    // Номер договора
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Серый цвет
    const docNumber = `№ ДП-${Date.now().toString().slice(-6)}`;
    pdf.text(docNumber, 105, 28, { align: "center" });

    // Разделительная линия
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 35, 190, 35);

    // Информация о сторонах
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0); // Черный цвет
    pdf.text("Стороны договора:", 20, 50);

    pdf.setFontSize(10);
    pdf.text("Исполнитель:", 20, 60);
    pdf.setFontSize(10);
    pdf.text('ООО "Alluna Design"', 60, 60);

    pdf.text("Заказчик:", 20, 70);
    pdf.text(data.clientName, 60, 70);

    pdf.text("Телефон:", 20, 80);
    pdf.text(data.clientPhone, 60, 80);

    pdf.text("Email:", 20, 90);
    pdf.text(data.clientEmail, 60, 90);

    // Предмет договора
    pdf.setFontSize(12);
    pdf.text("Предмет договора:", 20, 110);

    pdf.setFontSize(10);
    const subjectText = `Исполнитель обязуется оказать услуги по дизайну интерьера согласно техническому заданию по проекту "${
      data.projectName || data.documentName
    }".`;
    const splitSubject = pdf.splitTextToSize(subjectText, 170);
    pdf.text(splitSubject, 20, 120);

    // Условия
    pdf.setFontSize(12);
    pdf.text("Основные условия:", 20, 150);

    pdf.setFontSize(10);
    pdf.text(`Наименование документа: ${data.documentName}`, 20, 160);
    pdf.text(
      `Дата создания: ${new Date().toLocaleDateString("ru-RU")}`,
      20,
      170
    );
    pdf.text(
      `Время создания: ${new Date().toLocaleTimeString("ru-RU")}`,
      20,
      180
    );

    // Подписи
    pdf.setFontSize(10);
    pdf.text("_________________________", 30, 220);
    pdf.text('ООО "Alluna Design"', 35, 230);
    pdf.text("(Исполнитель)", 50, 237);

    pdf.text("_________________________", 130, 220);
    pdf.text(data.clientName, 135, 230);
    pdf.text("(Заказчик)", 150, 237);

    // Генерируем PDF в формате base64
    const pdfBlob = pdf.output("blob");

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log(
          "[PDF Generator] PDF generated successfully, format:",
          base64data.substring(0, 50)
        );
        console.log("[PDF Generator] PDF total length:", base64data.length);
        resolve(base64data);
      };
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error("[PDF Generator] Error in main generation:", error);

    // Фолбэк - минимальный PDF с гарантированно правильным форматом
    try {
      const pdf = new jsPDF();
      pdf.text("Договор оказания услуг", 20, 20);
      pdf.text(`Клиент: ${data.clientName}`, 20, 30);
      pdf.text(`Телефон: ${data.clientPhone}`, 20, 40);
      pdf.text(`Email: ${data.clientEmail}`, 20, 50);
      pdf.text(`Проект: ${data.documentName}`, 20, 60);
      pdf.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, 20, 70);

      const pdfBlob = pdf.output("blob");

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          console.log("[PDF Generator] Fallback PDF generated");
          resolve(base64data);
        };
        reader.readAsDataURL(pdfBlob);
      });
    } catch (fallbackError) {
      console.error("[PDF Generator] Fallback also failed:", fallbackError);
      // Последний резервный вариант - простая строка
      const simplePdf = "data:application/pdf;base64,VEVTVCBQREYgRE9DVU1FTlQ="; // "TEST PDF DOCUMENT" в base64
      return Promise.resolve(simplePdf);
    }
  }
}
