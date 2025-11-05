"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Mail,
  Phone,
  AlertCircle,
  User,
  FileText,
  Download,
} from "lucide-react";
import { ContractPreview, type ContractData } from "@/components/contract-preview";
import domtoimage from 'dom-to-image';
import jsPDF from "jspdf";

interface SendForSigningDialogProps {
  documentId: string;
  documentName: string;
  clientPhone: string;
  clientEmail?: string;
  clientName?: string;
  projectName?: string;
  documentContent?: string;
  onSendForSigning: (data: {
    document_id: string;
    document_name: string;
    signer: {
      name: string;
      email: string;
      phone: string;
    };
    file_data: string; // base64 PDF
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function SendForSigningDialog({
  documentId,
  documentName,
  clientPhone,
  clientEmail = "",
  clientName = "",
  projectName = "",
  documentContent = "",
  onSendForSigning,
  trigger,
}: SendForSigningDialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(clientPhone);
  const [email, setEmail] = useState(clientEmail);
  const [name, setName] = useState(clientName);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number>(0);
  
  const contractPreviewRef = useRef<HTMLDivElement>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string) => {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    return nameParts.length >= 2;
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10;
  };

  // Функция для получения данных контракта
  const getContractData = (): ContractData => {
    let baseData: Partial<ContractData> = {};
    
    if (documentContent) {
      try {
        baseData = JSON.parse(documentContent);
      } catch (error) {
        console.error("Error parsing document content:", error);
      }
    }

    return {
      projectName: projectName || baseData.projectName || documentName,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      projectDescription: baseData.projectDescription || "",
      totalAmount: baseData.totalAmount || "0",
      advancePayment: baseData.advancePayment || "0",
      workPeriod: baseData.workPeriod || "14",
      additionalTerms: baseData.additionalTerms || "",
      contractNumber: baseData.contractNumber,
      createdAt: baseData.createdAt || new Date().toISOString(),
    };
  };

  // Основная функция генерации PDF с агрессивной оптимизацией
  const handleGeneratePDF = async () => {
    if (!name.trim() || !validateName(name)) {
      setError("Укажите корректное ФИО клиента");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Некорректный формат телефона");
      return;
    }

    if (!validateEmail(email)) {
      setError("Некорректный формат email");
      return;
    }

    setIsGeneratingPDF(true);
    setError("");

    try {
      const element = contractPreviewRef.current;
      if (!element) {
        throw new Error("Не удалось загрузить preview контракта");
      }

      console.log("Starting ultra-optimized PDF generation...");

      // Даем время на полный рендеринг компонента
      await new Promise(resolve => setTimeout(resolve, 500));

      // Создаем временный контейнер с минимальными настройками
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '400px'; // Сильно уменьшаем ширину
      tempContainer.style.maxWidth = '400px';
      tempContainer.style.zIndex = '-1000';
      tempContainer.style.opacity = '0';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.overflow = 'hidden';
      
      // Клонируем элемент и применяем агрессивные оптимизации
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Минималистичные стили
      clone.style.width = '100%';
      clone.style.maxWidth = '100%';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.boxSizing = 'border-box';
      clone.style.backgroundColor = '#ffffff';
      clone.style.transform = 'none';
      clone.style.position = 'static';
      clone.style.fontSize = '12px'; // Уменьшаем размер шрифта
      
      // Агрессивная оптимизация всех элементов
      const allElements = clone.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        
        // Убираем все визуальные эффекты
        element.style.boxShadow = 'none';
        element.style.textShadow = 'none';
        element.style.borderRadius = '0';
        element.style.backgroundImage = 'none';
        element.style.gradient = 'none';
        
        // Уменьшаем отступы и границы
        element.style.padding = '2px';
        element.style.margin = '1px';
        element.style.border = '1px solid #000';
        
        // Оптимизируем текст
        element.style.lineHeight = '1.2';
        element.style.letterSpacing = '0';
        
        // Убираем анимации и трансформации
        element.style.transition = 'none';
        element.style.animation = 'none';
        element.style.transform = 'none';
      });

      // Оптимизируем карточки
      const cards = clone.querySelectorAll('.max-w-4xl, [class*="max-w-"], .card, [class*="card"]');
      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        cardElement.style.maxWidth = '100%';
        cardElement.style.width = '100%';
        cardElement.style.margin = '0';
        cardElement.style.padding = '5px';
        cardElement.style.boxSizing = 'border-box';
        cardElement.style.border = '1px solid #ccc';
      });

      // Оптимизируем контент карточек
      const cardContents = clone.querySelectorAll('[class*="p-"], .card-content, [class*="content"]');
      cardContents.forEach(content => {
        const contentElement = content as HTMLElement;
        contentElement.style.padding = '5px';
        contentElement.style.boxSizing = 'border-box';
        contentElement.style.margin = '0';
      });

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Ждем применения стилей
        await new Promise(resolve => setTimeout(resolve, 300));

        // Получаем размеры контента
        const contentWidth = clone.scrollWidth;
        const contentHeight = clone.scrollHeight;
        
        console.log(`Optimized content dimensions: ${contentWidth}x${contentHeight}`);

        // Генерируем JPEG с очень низким качеством
        const jpegDataUrl = await domtoimage.toJpeg(clone, {
          quality: 0.3, // Очень низкое качество для максимального сжатия
          bgcolor: '#ffffff',
          width: contentWidth,
          height: contentHeight,
          style: {
            transform: 'none',
            margin: '0',
            padding: '0',
            left: '0',
            top: '0'
          },
          filter: (node) => {
            // Фильтруем ненужные элементы
            if (node instanceof Element) {
              const tagName = node.tagName.toLowerCase();
              // Можно исключить определенные элементы если нужно
              return true;
            }
            return true;
          }
        });

        console.log("Ultra-compressed JPEG generated, creating PDF...");

        // Создаем PDF с минимальными настройками
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Минимальные поля
        const margin = 5;
        const contentPdfWidth = pdfWidth - (2 * margin);
        
        const img = new Image();
        img.src = jpegDataUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(() => reject(new Error("Image load timeout")), 15000);
        });

        const imgWidth = img.width;
        const imgHeight = img.height;

        // Рассчитываем соотношение
        const ratio = contentPdfWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        console.log(`PDF dimensions: ${pdfWidth}x${pdfHeight}mm, Scaled height: ${scaledHeight}mm`);

        // Простая разбивка на страницы
        let currentPage = 0;
        let position = margin;
        const pageContentHeight = pdfHeight - (2 * margin);
        
        while (position < (scaledHeight + margin)) {
          if (currentPage > 0) {
            pdf.addPage();
          }
          
          const remainingHeight = scaledHeight - (position - margin);
          const pageHeight = Math.min(pageContentHeight, remainingHeight);
          
          // Создаем canvas для обрезки
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const srcY = ((position - margin) / scaledHeight) * imgHeight;
          const srcHeight = (pageHeight / scaledHeight) * imgHeight;
          
          canvas.width = imgWidth;
          canvas.height = srcHeight;
          
          if (ctx) {
            ctx.drawImage(
              img,
              0, srcY, imgWidth, srcHeight,
              0, 0, imgWidth, srcHeight
            );
            
            const pageImageData = canvas.toDataURL('image/jpeg', 0.3);
            
            pdf.addImage(
              pageImageData,
              'JPEG',
              margin,
              margin,
              contentPdfWidth,
              pageHeight
            );
          }
          
          console.log(`Added page ${currentPage + 1}`);
          
          position += pageContentHeight;
          currentPage++;
        }

        // Получаем PDF как Blob и проверяем размер
        const pdfBlob = pdf.output('blob');
        const sizeMB = pdfBlob.size / 1024 / 1024;
        setPdfSize(sizeMB);
        
        console.log(`Generated PDF size: ${sizeMB.toFixed(2)} MB`);

        // Проверяем размер файла
        if (sizeMB > 8) { // 8MB с запасом до 10MB
          console.warn("PDF still too large, trying alternative approach...");
          // Пробуем альтернативный метод с еще большей компрессией
          const alternativePdfBlob = await generateAlternativePDF(element);
          const alternativeSizeMB = alternativePdfBlob.size / 1024 / 1024;
          
          if (alternativeSizeMB > 8) {
            throw new Error(`PDF_SIZE_TOO_LARGE: ${alternativeSizeMB.toFixed(2)}MB`);
          }
          
          const pdfBase64 = await blobToBase64(alternativePdfBlob);
          setPdfPreview(pdfBase64);
          setPdfSize(alternativeSizeMB);
        } else {
          const pdfBase64 = await blobToBase64(pdfBlob);
          setPdfPreview(pdfBase64);
        }

        console.log("Ultra-optimized PDF successfully generated");

      } finally {
        // Всегда удаляем временный контейнер
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }

    } catch (error) {
      console.error("PDF generation error:", error);
      
      if (error instanceof Error && error.message.startsWith("PDF_SIZE_TOO_LARGE")) {
        const sizeMatch = error.message.match(/(\d+\.\d+)MB/);
        const size = sizeMatch ? sizeMatch[1] : "неизвестно";
        setError(`Документ слишком большой (${size} MB). Максимальный размер для отправки - 10 MB. Пожалуйста, сократите содержимое документа или разбейте его на несколько частей.`);
      } else {
        setError(
          error instanceof Error
            ? error.message
            : "Ошибка при генерации PDF документа. Попробуйте еще раз."
        );
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Альтернативный метод генерации PDF для очень больших документов
  const generateAlternativePDF = async (element: HTMLElement): Promise<Blob> => {
    console.log("Using alternative PDF generation method...");
    
    // Создаем максимально упрощенный контейнер
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '0';
    tempContainer.style.top = '0';
    tempContainer.style.width = '300px';
    tempContainer.style.maxWidth = '300px';
    tempContainer.style.zIndex = '-1000';
    tempContainer.style.opacity = '0';
    tempContainer.style.backgroundColor = '#ffffff';
    
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Максимальная оптимизация
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.fontSize = '10px';
    
    // Убираем все лишнее
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.boxShadow = 'none';
      element.style.borderRadius = '0';
      element.style.backgroundImage = 'none';
      element.style.padding = '1px';
      element.style.margin = '0';
      element.style.border = 'none';
    });

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Генерируем с минимальным качеством
      const jpegDataUrl = await domtoimage.toJpeg(clone, {
        quality: 0.2, // Минимальное качество
        bgcolor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(jpegDataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 3; // Минимальные поля
      const contentWidth = pdfWidth - (2 * margin);
      
      const ratio = contentWidth / imgProps.width;
      const imgWidth = contentWidth;
      const imgHeight = imgProps.height * ratio;

      // Простая разбивка на страницы
      let heightLeft = imgHeight;
      let position = margin;
      let pageNumber = 1;

      pdf.addImage(jpegDataUrl, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (2 * margin));

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(jpegDataUrl, 'JPEG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - (2 * margin));
        pageNumber++;
      }

      return pdf.output('blob');
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  };

  // Вспомогательная функция для конвертации Blob в base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (!result.startsWith("data:application/pdf")) {
          console.error("Generated data URL is not a PDF:", result.substring(0, 100));
          reject(new Error("Сгенерированный файл имеет неверный формат"));
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read PDF blob"));
      reader.readAsDataURL(blob);
    });
  };

  const handleDownloadPDF = () => {
    if (pdfPreview) {
      const link = document.createElement("a");
      link.href = pdfPreview;
      link.download = `${documentName.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Проверяем размер файла перед отправкой
    if (pdfSize > 10) {
      setError(`Размер файла (${pdfSize.toFixed(2)} MB) превышает максимально допустимый размер 10 MB. Пожалуйста, сгенерируйте документ заново или сократите его содержимое.`);
      return;
    }

    if (!name.trim() || !validateName(name)) {
      setError("Укажите корректное ФИО клиента");
      return;
    }

    if (!phone.trim() || !validatePhone(phone)) {
      setError("Некорректный формат телефона");
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setError("Некорректный формат email");
      return;
    }

    if (!pdfPreview) {
      setError("Сначала сгенерируйте PDF документ");
      return;
    }

    if (!pdfPreview.startsWith("data:application/pdf")) {
      setError("Сгенерированный файл имеет неверный формат. Пожалуйста, сгенерируйте PDF еще раз.");
      return;
    }

    setIsLoading(true);

    try {
      await onSendForSigning({
        document_id: documentId,
        document_name: documentName,
        signer: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        file_data: pdfPreview,
      });
      setOpen(false);
      setError("");
      setPdfPreview(null);
      setPdfSize(0);
    } catch (error) {
      console.error("Error sending for signing:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка при отправке документа"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length >= 1) {
      if (digits.startsWith("8")) {
        return (
          "+7 " +
          digits
            .slice(1)
            .replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "($1) $2-$3-$4")
        );
      } else if (digits.startsWith("7")) {
        return (
          "+" +
          digits.replace(
            /(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/,
            "$1 ($2) $3-$4-$5"
          )
        );
      }
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const contractData = getContractData();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Отправить на подпись
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Отправить документ на подпись
          </DialogTitle>
          <DialogDescription>
            Документ "{documentName}" будет автоматически сгенерирован и
            отправлен клиенту на подписание.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">ФИО клиента *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`pl-10 ${
                    !validateName(name) && name ? "border-orange-500" : ""
                  }`}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Обязательно укажите фамилию, имя и отчество (если есть)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Номер телефона *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`pl-10 ${
                    !validatePhone(phone) && phone ? "border-orange-500" : ""
                  }`}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Форматы: +7 (XXX) XXX-XX-XX, 8 (XXX) XXX-XX-XX
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email клиента *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${
                    !validateEmail(email) && email ? "border-red-500" : ""
                  }`}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                На этот email будет отправлена ссылка для подписания
              </p>
            </div>

            {/* Скрытый ContractPreview для генерации PDF */}
            <div style={{ 
              position: 'fixed', 
              left: '-9999px', 
              top: '-9999px', 
              width: '400px',
              zIndex: -1000 
            }}>
              <ContractPreview
                ref={contractPreviewRef}
                contractData={contractData}
                isReadOnly={true}
                hideActions={true}
              />
            </div>

            {/* PDF Generation Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Генерация документа</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Сгенерировать PDF
                    </>
                  )}
                </Button>
              </div>

              {pdfPreview && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="text-green-800 font-medium">
                          PDF документ готов
                        </span>
                        {pdfSize > 0 && (
                          <p className="text-xs text-green-600">
                            Размер файла: {pdfSize.toFixed(2)} MB
                            {pdfSize > 8 && (
                              <span className="text-orange-600 ml-1">
                                (близко к лимиту 10 MB)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Скачать
                    </Button>
                  </div>

                  {/* PDF Preview */}
                  <div className="border rounded overflow-hidden">
                    <iframe
                      src={pdfPreview}
                      className="w-full h-64"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}

              {!pdfPreview && !isGeneratingPDF && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Нажмите "Сгенерировать PDF" чтобы создать документ для подписания</p>
                  <div className="text-xs bg-white p-2 rounded border">
                    <p><strong>Будет сгенерирован договор со следующими данными:</strong></p>
                    <p>• Проект: {contractData.projectName}</p>
                    <p>• Клиент: {name || "(не указан)"}</p>
                    <p>• Телефон: {phone || "(не указан)"}</p>
                    <p>• Email: {email || "(не указан)"}</p>
                    <p>• Сумма: {Number(contractData.totalAmount).toLocaleString("ru-RU")} руб.</p>
                    <p>• Аванс: {Number(contractData.advancePayment).toLocaleString("ru-RU")} руб.</p>
                  </div>
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                    <strong>Внимание:</strong> Используется агрессивное сжатие для уменьшения размера файла.
                    Качество изображения может быть снижено для соответствия лимиту 10 MB.
                  </div>
                </div>
              )}

              {isGeneratingPDF && (
                <div className="text-center py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
                    <p className="text-sm text-muted-foreground">Генерация PDF документа...</p>
                    <p className="text-xs text-muted-foreground">Применяется агрессивное сжатие для уменьшения размера</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Что произойдет:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Будет сгенерирован PDF документ с договором</li>
                <li>2. Документ будет загружен в систему Podpislon</li>
                <li>
                  3. На email клиента придет письмо со ссылкой для подписания
                </li>
                <li>4. Клиент сможет подписать документ онлайн</li>
                <li>5. После подписания статус обновится автоматически</li>
              </ol>
              <div className="mt-2 text-xs text-orange-600">
                <strong>Ограничение:</strong> Максимальный размер файла - 10 MB
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPdfPreview(null);
                setPdfSize(0);
              }}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !pdfPreview || pdfSize > 10}
              title={pdfSize > 10 ? "Размер файла превышает 10 MB" : ""}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Отправить на подпись
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}