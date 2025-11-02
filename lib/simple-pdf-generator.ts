// lib/simple-pdf-generator.ts
import jsPDF from 'jspdf'

export interface PDFData {
  documentName: string
  clientName: string
  clientPhone: string
  clientEmail: string
  projectName?: string
}

export function generateSimplePDF(data: PDFData): string {
  try {
    const pdf = new jsPDF()
    
    // Заголовок
    pdf.setFontSize(16)
    pdf.setTextColor(37, 99, 235)
    pdf.text('ДОГОВОР ОКАЗАНИЯ УСЛУГ', 105, 20, { align: 'center' })
    
    // Номер договора
    pdf.setFontSize(10)
    pdf.setTextColor(107, 114, 128)
    pdf.text(`№ ДП-${Date.now().toString().slice(-6)}`, 105, 28, { align: 'center' })
    
    // Информация о сторонах
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Стороны договора:', 20, 50)
    pdf.text('Исполнитель: ООО "Alluna Design"', 20, 60)
    pdf.text(`Заказчик: ${data.clientName}`, 20, 70)
    pdf.text(`Телефон: ${data.clientPhone}`, 20, 80)
    pdf.text(`Email: ${data.clientEmail}`, 20, 90)
    
    // Предмет договора
    pdf.text('Предмет договора:', 20, 110)
    const subjectText = `Исполнитель обязуется оказать услуги по дизайну интерьера согласно техническому заданию по проекту "${data.projectName || data.documentName}".`
    const splitSubject = pdf.splitTextToSize(subjectText, 170)
    pdf.text(splitSubject, 20, 120)
    
    // Условия
    pdf.text('Условия договора:', 20, 150)
    pdf.text(`Документ: ${data.documentName}`, 20, 160)
    pdf.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, 20, 170)
    
    // Подписи
    pdf.text('_________________________', 30, 220)
    pdf.text('ООО "Alluna Design"', 40, 230)
    
    pdf.text('_________________________', 130, 220)
    pdf.text(data.clientName, 140, 230)
    
    const pdfBase64 = pdf.output('datauristring')
    
    if (!pdfBase64.startsWith('data:application/pdf;base64,')) {
      throw new Error('Simple PDF generation failed')
    }
    
    return pdfBase64
  } catch (error) {
    // Последний фолбэк - минимальный PDF
    const pdf = new jsPDF()
    pdf.text('Договор оказания услуг', 20, 20)
    pdf.text(`Клиент: ${data.clientName}`, 20, 30)
    pdf.text(`Проект: ${data.documentName}`, 20, 40)
    pdf.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 50)
    return pdf.output('datauristring')
  }
}