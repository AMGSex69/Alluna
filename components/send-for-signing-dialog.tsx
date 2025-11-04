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

      console.log("Starting PDF generation from ContractPreview...");

      // Даем время на полный рендеринг компонента
      await new Promise(resolve => setTimeout(resolve, 500));

      // Создаем временный контейнер для рендеринга с фиксированной шириной A4
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempContainer.style.zIndex = '-1000';
      tempContainer.style.opacity = '0';
      tempContainer.style.pointerEvents = 'none';
      
      // Клонируем элемент для изоляции
      const clone = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Получаем высоту содержимого для расчета количества страниц
        const contentHeight = clone.scrollHeight;
        const pageHeight = 1122; // A4 height in pixels at 96 DPI
        
        console.log(`Content height: ${contentHeight}px, Page height: ${pageHeight}px`);
        
        // Используем dom-to-image для генерации PNG каждой страницы
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4",
        });

        const totalPages = Math.ceil(contentHeight / pageHeight);
        console.log(`Total pages needed: ${totalPages}`);

        for (let pageNum = 0; pageNum < totalPages; pageNum++) {
          if (pageNum > 0) {
            pdf.addPage();
          }

          // Вычисляем область видимости для текущей страницы
          const clipY = pageNum * pageHeight;
          const clipHeight = Math.min(pageHeight, contentHeight - clipY);

          console.log(`Generating page ${pageNum + 1}, clipY: ${clipY}, clipHeight: ${clipHeight}`);

          // Генерируем PNG для текущей страницы
          const pngDataUrl = await domtoimage.toPng(clone, {
            quality: 1,
            bgcolor: '#ffffff',
            width: 794,
            height: contentHeight,
            style: {
              transform: `translateY(-${clipY}px)`,
              transformOrigin: 'top left'
            }
          });

          // Добавляем изображение в PDF
          const imgProps = pdf.getImageProperties(pngDataUrl);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          // Рассчитываем размеры для вставки в PDF
          const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
          const imgWidth = imgProps.width * ratio;
          const imgHeight = imgProps.height * ratio;

          // Вычисляем смещение для обрезки
          const visibleHeightRatio = clipHeight / contentHeight;
          const displayHeight = imgHeight * visibleHeightRatio;

          pdf.addImage(
            pngDataUrl, 
            'PNG', 
            0, 
            0, 
            imgWidth, 
            displayHeight,
            null,
            'FAST'
          );
        }
        
        // Генерируем PDF как Blob
        const pdfBlob = pdf.output('blob');
        
        // Конвертируем Blob в base64 data URL
        const pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log("PDF data URL generated successfully");
            resolve(result);
          };
          reader.onerror = () => reject(new Error("Failed to read PDF blob"));
          reader.readAsDataURL(pdfBlob);
        });

        // Проверяем, что это действительно PDF data URL
        if (!pdfBase64.startsWith("data:application/pdf")) {
          console.error("Generated data URL is not a PDF:", pdfBase64.substring(0, 100));
          throw new Error("Сгенерированный файл имеет неверный формат");
        }

        setPdfPreview(pdfBase64);
        console.log("Multi-page PDF successfully generated");

      } finally {
        // Всегда удаляем временный контейнер
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }

    } catch (error) {
      console.error("PDF generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Ошибка при генерации PDF документа. Попробуйте еще раз."
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Альтернативная упрощенная версия для большей надежности
  const handleGeneratePDFAlternative = async () => {
    if (!name.trim() || !validateName(name)) {
      setError("Укажите корректное ФИО клиента");
      return;
    }

    setIsGeneratingPDF(true);
    setError("");

    try {
      const element = contractPreviewRef.current;
      if (!element) {
        throw new Error("Не удалось загрузить preview контракта");
      }

      console.log("Starting alternative PDF generation...");

      // Даем время на полный рендеринг компонента
      await new Promise(resolve => setTimeout(resolve, 500));

      // Создаем временный контейнер
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px';
      tempContainer.style.zIndex = '-1000';
      tempContainer.style.opacity = '0';
      
      const clone = element.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Генерируем одно большое изображение
        const pngDataUrl = await domtoimage.toPng(clone, {
          quality: 0.9,
          bgcolor: '#ffffff',
        });

        // Создаем PDF и разбиваем на страницы
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const img = new Image();
        img.src = pngDataUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const imgWidth = img.width;
        const imgHeight = img.height;

        // Рассчитываем соотношение для A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Масштабируем по ширине
        const ratio = pdfWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        // Если контент помещается на одну страницу
        if (scaledHeight <= pdfHeight) {
          pdf.addImage(pngDataUrl, 'PNG', 0, 0, pdfWidth, scaledHeight);
        } else {
          // Разбиваем на несколько страниц
          let position = 0;
          let pageNumber = 1;
          
          while (position < scaledHeight) {
            if (pageNumber > 1) {
              pdf.addPage();
            }
            
            // Вычисляем видимую часть для текущей страницы
            const pageImgHeight = Math.min(pdfHeight, scaledHeight - position);
            
            pdf.addImage(
              pngDataUrl,
              'PNG',
              0, 
              -position, 
              pdfWidth, 
              scaledHeight
            );
            
            position += pdfHeight;
            pageNumber++;
          }
        }

        const pdfBlob = pdf.output('blob');
        const pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });

        if (!pdfBase64.startsWith("data:application/pdf")) {
          throw new Error("Сгенерированный файл имеет неверный формат");
        }

        setPdfPreview(pdfBase64);
        console.log("Alternative PDF generation completed");

      } finally {
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }

    } catch (error) {
      console.error("Alternative PDF generation error:", error);
      // Пробуем самую простую версию как запасной вариант
      await handleGeneratePDFSimple();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Самая простая версия как запасной вариант
  const handleGeneratePDFSimple = async () => {
    try {
      const element = contractPreviewRef.current;
      if (!element) return;

      const pngDataUrl = await domtoimage.toPng(element, {
        quality: 0.8,
        bgcolor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(pngDataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      let imgHeight = imgProps.height * ratio;

      // Если изображение слишком высокое, создаем несколько страниц
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;

      // Первая страница
      pdf.addImage(pngDataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Добавляем дополнительные страницы если нужно
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(pngDataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        pageNumber++;
      }

      const pdfBlob = pdf.output('blob');
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      setPdfPreview(pdfBase64);
    } catch (error) {
      console.error("Simple PDF generation failed:", error);
      throw error;
    }
  };

  // Основная функция генерации с fallback
  const handleGeneratePDFMain = async () => {
    try {
      await handleGeneratePDFAlternative();
    } catch (error) {
      console.error("All PDF generation methods failed, using simple method");
      await handleGeneratePDFSimple();
    }
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
                  onChange={(handlePhoneChange)}
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
              width: '794px',
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
                  onClick={handleGeneratePDFMain}
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
                      <span className="text-green-800 font-medium">
                        PDF документ готов
                      </span>
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
                </div>
              )}

              {isGeneratingPDF && (
                <div className="text-center py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
                    <p className="text-sm text-muted-foreground">Генерация PDF документа...</p>
                    <p className="text-xs text-muted-foreground">Это может занять несколько секунд</p>
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
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPdfPreview(null);
              }}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !pdfPreview}>
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