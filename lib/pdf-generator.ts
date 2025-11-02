// /lib/pdf-generator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFData {
  documentName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  projectName?: string;
  contractData?: any;
}

export async function generateContractPDF(data: PDFData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Создаем временный HTML элемент для рендеринга
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '794px'; // A4 width in pixels
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.backgroundColor = 'white';
      
      tempDiv.innerHTML = `
        <div style="max-width: 700px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">ДОГОВОР ОКАЗАНИЯ УСЛУГ</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">№ ДП-${Date.now().toString().slice(-6)}</p>
          </div>

          <!-- Contract Details -->
          <div style="margin-bottom: 30px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Стороны договора:</h2>
              <p style="margin: 8px 0;"><strong>Исполнитель:</strong> ООО "Alluna Design"</p>
              <p style="margin: 8px 0;"><strong>Заказчик:</strong> ${data.clientName}</p>
              <p style="margin: 8px 0;"><strong>Телефон:</strong> ${data.clientPhone}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${data.clientEmail}</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Предмет договора:</h3>
              <p style="margin: 0; line-height: 1.6;">
                Исполнитель обязуется оказать услуги по дизайну интерьера согласно техническому заданию по проекту 
                "${data.projectName || data.documentName}", а Заказчик обязуется принять и оплатить данные услуги.
              </p>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Условия договора:</h3>
              <p style="margin: 5px 0;"><strong>Документ:</strong> ${data.documentName}</p>
              <p style="margin: 5px 0;"><strong>Дата создания:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
              <p style="margin: 5px 0;"><strong>Статус:</strong> Для подписания</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; line-height: 1.6;">
                <strong>Подписание договора:</strong> Настоящий договор вступает в силу с момента его подписания 
                обеими сторонами с использованием сервиса электронной подписи Podpislon.
              </p>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Основные условия:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Стоимость услуг определяется согласно утвержденному техническому заданию</li>
              <li>Сроки выполнения работ согласовываются дополнительно</li>
              <li>Оплата производится по этапам согласно графику платежей</li>
              <li>Все изменения в договор вносятся дополнительными соглашениями</li>
            </ul>
          </div>

          <!-- Signatures -->
          <div style="display: flex; justify-content: space-between; margin-top: 60px;">
            <div style="text-align: center;">
              <div style="border-top: 1px solid #d1d5db; padding-top: 10px; width: 200px;">
                <p style="margin: 0; font-size: 14px;"><strong>Исполнитель</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">ООО "Alluna Design"</p>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 1px solid #d1d5db; padding-top: 10px; width: 200px;">
                <p style="margin: 0; font-size: 14px;"><strong>Заказчик</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${data.clientName}</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              Документ создан в системе Alluna Design и отправлен на подписание через сервис Podpislon
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Конвертируем HTML в canvas, затем в PDF
      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Рассчитываем размеры изображения для PDF
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
        
        // Конвертируем PDF в base64
        const pdfBase64 = pdf.output('datauristring');
        resolve(pdfBase64);
      }).catch(error => {
        document.body.removeChild(tempDiv);
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Фолбэк генерация простого PDF если html2canvas не сработает
export function generateSimplePDF(data: PDFData): string {
  const pdf = new jsPDF();
  
  // Заголовок
  pdf.setFontSize(16);
  pdf.setTextColor(37, 99, 235);
  pdf.text('ДОГОВОР ОКАЗАНИЯ УСЛУГ', 105, 20, { align: 'center' });
  
  // Номер договора
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`№ ДП-${Date.now().toString().slice(-6)}`, 105, 28, { align: 'center' });
  
  // Информация о сторонах
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Стороны договора:', 20, 50);
  pdf.text('Исполнитель: ООО "Alluna Design"', 20, 60);
  pdf.text(`Заказчик: ${data.clientName}`, 20, 70);
  pdf.text(`Телефон: ${data.clientPhone}`, 20, 80);
  pdf.text(`Email: ${data.clientEmail}`, 20, 90);
  
  // Предмет договора
  pdf.text('Предмет договора:', 20, 110);
  const subjectText = `Исполнитель обязуется оказать услуги по дизайну интерьера согласно техническому заданию по проекту "${data.projectName || data.documentName}".`;
  const splitSubject = pdf.splitTextToSize(subjectText, 170);
  pdf.text(splitSubject, 20, 120);
  
  // Условия
  pdf.text('Условия договора:', 20, 150);
  pdf.text(`Документ: ${data.documentName}`, 20, 160);
  pdf.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, 20, 170);
  
  // Подписи
  pdf.text('_________________________', 30, 220);
  pdf.text('ООО "Alluna Design"', 40, 230);
  
  pdf.text('_________________________', 130, 220);
  pdf.text(data.clientName, 140, 230);
  
  return pdf.output('datauristring');
}