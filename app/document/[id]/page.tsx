"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Copy,
  Calendar,
  User,
  Phone,
  Loader2,
  Check,
} from "lucide-react";
import { ContractPreview } from "@/components/contract-preview";
import { getDocument, getProject } from "@/lib/projects";
import type { Document, Project } from "@/lib/supabase/client";
import domtoimage from 'dom-to-image';
import jsPDF from "jspdf";
import React from "react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "signed":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Подписан
        </Badge>
      );
    case "pending_signature":
      return (
        <Badge
          variant="default"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Ожидает подписи
        </Badge>
      );
    case "draft":
      return (
        <Badge
          variant="default"
          className="bg-gray-100 text-gray-800 hover:bg-gray-100"
        >
          Черновик
        </Badge>
      );
    default:
      return <Badge variant="secondary">Неизвестно</Badge>;
  }
};

const getDocumentTypeLabel = (type: string) => {
  switch (type) {
    case "contract":
      return "Договор";
    case "attachment":
      return "Приложение";
    case "act":
      return "Акт";
    case "agreement":
      return "Дополнительное соглашение";
    case "invoice":
      return "Счет";
    default:
      return "Документ";
  }
};

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const printRef = React.useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!document) return;
    
    setIsGeneratingPdf(true);
    try {
      if (document.file_url) {
        window.open(document.file_url, "_blank");
        return;
      }

      const element = printRef.current;
      if (!element) {
        console.error("Element for PDF generation not found");
        return;
      }

      console.log("Starting PDF generation with improved positioning...");

      // Создаем временный контейнер с правильными стилями
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '0';
      tempContainer.style.top = '0';
      tempContainer.style.width = '794px'; // A4 width in pixels
      tempContainer.style.maxWidth = '794px';
      tempContainer.style.zIndex = '-1000';
      tempContainer.style.opacity = '0';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.overflow = 'hidden';
      
      // Клонируем элемент и применяем стили для правильного позиционирования
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Применяем стили для правильного отображения в PDF
      clone.style.width = '100%';
      clone.style.maxWidth = '100%';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.boxSizing = 'border-box';
      clone.style.backgroundColor = '#ffffff';
      clone.style.transform = 'none';
      clone.style.position = 'static';
      
      // Находим и стилизуем внутренние элементы для предотвращения обрезания
      const cards = clone.querySelectorAll('.max-w-4xl, [class*="max-w-"]');
      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        cardElement.style.maxWidth = '100%';
        cardElement.style.width = '100%';
        cardElement.style.margin = '0';
        cardElement.style.padding = '0';
        cardElement.style.boxSizing = 'border-box';
      });

      // Стилизуем CardContent чтобы убрать лишние отступы
      const cardContents = clone.querySelectorAll('[class*="p-"]');
      cardContents.forEach(content => {
        const contentElement = content as HTMLElement;
        contentElement.style.padding = '20px';
        contentElement.style.boxSizing = 'border-box';
        contentElement.style.margin = '0';
      });

      // Убираем любые трансформации и смещения
      const allElements = clone.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        element.style.transform = 'none';
        element.style.transformOrigin = 'top left';
        element.style.position = 'static';
      });

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        // Ждем применения стилей
        await new Promise(resolve => setTimeout(resolve, 500));

        // Получаем точные размеры контента
        const contentWidth = clone.scrollWidth;
        const contentHeight = clone.scrollHeight;
        
        console.log(`Content dimensions: ${contentWidth}x${contentHeight}`);

        // Генерируем PNG с правильными настройками
        const pngDataUrl = await domtoimage.toPng(clone, {
          quality: 0.95,
          bgcolor: '#ffffff',
          width: contentWidth,
          height: contentHeight,
          style: {
            transform: 'none',
            margin: '0',
            padding: '0',
            left: '0',
            top: '0'
          }
        });

        console.log("PNG generated, creating PDF with proper positioning...");

        // Создаем PDF с полями
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Добавляем поля (отступы) - уменьшаем для большего контента
        const margin = 15; // 15mm margins
        const contentPdfWidth = pdfWidth - (2 * margin);
        
        const img = new Image();
        img.src = pngDataUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(() => reject(new Error("Image load timeout")), 10000);
        });

        const imgWidth = img.width;
        const imgHeight = img.height;

        // Рассчитываем соотношение с учетом полей
        const ratio = contentPdfWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        console.log(`PDF dimensions: ${pdfWidth}x${pdfHeight}mm, Content area: ${contentPdfWidth}mm wide`);
        console.log(`Image scaled: ${contentPdfWidth}mm wide, ${scaledHeight}mm high`);

        // Если контент помещается на одну страницу с полями
        if (scaledHeight <= (pdfHeight - (2 * margin))) {
          pdf.addImage(
            pngDataUrl, 
            'PNG', 
            margin, 
            margin, 
            contentPdfWidth, 
            scaledHeight
          );
          console.log("Document fits on one page with margins");
        } else {
          // Разбиваем на несколько страниц с полями
          let currentPage = 0;
          let position = 0;
          const pageContentHeight = pdfHeight - (2 * margin);
          
          while (position < scaledHeight) {
            if (currentPage > 0) {
              pdf.addPage();
            }
            
            // Вычисляем видимую часть для текущей страницы
            const remainingHeight = scaledHeight - position;
            const pageHeight = Math.min(pageContentHeight, remainingHeight);
            
            // Создаем canvas для обрезки текущей страницы
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Вычисляем область исходного изображения для текущей страницы
            const srcY = (position / scaledHeight) * imgHeight;
            const srcHeight = (pageHeight / scaledHeight) * imgHeight;
            
            canvas.width = imgWidth;
            canvas.height = srcHeight;
            
            if (ctx) {
              // Рисуем только нужную часть изображения
              ctx.drawImage(
                img,
                0, srcY, imgWidth, srcHeight, // source rectangle
                0, 0, imgWidth, srcHeight     // destination rectangle
              );
              
              const pageImageData = canvas.toDataURL('image/png');
              
              // Добавляем обрезанное изображение на текущую страницу
              pdf.addImage(
                pageImageData,
                'PNG',
                margin,
                margin,
                contentPdfWidth,
                pageHeight
              );
            }
            
            console.log(`Added page ${currentPage + 1}, position: ${position}mm, height: ${pageHeight}mm`);
            
            position += pageContentHeight;
            currentPage++;
          }
          console.log(`Document split into ${currentPage} pages`);
        }

        const fileName = `${document.name || 'document'}.pdf`;
        pdf.save(fileName);
        
        console.log("PDF successfully generated with proper positioning");

      } finally {
        // Всегда удаляем временный контейнер
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }

    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Fallback: простая версия
      try {
        console.log("Trying fallback PDF generation...");
        await handleDownloadPdfSimple();
      } catch (fallbackError) {
        console.error("Fallback PDF generation also failed:", fallbackError);
        alert("Произошла ошибка при генерации PDF. Попробуйте еще раз.");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Упрощенная версия с базовыми настройками
  const handleDownloadPdfSimple = async () => {
    if (!document) return;

    const element = printRef.current;
    if (!element) return;

    // Простая генерация без сложных манипуляций
    const dataUrl = await domtoimage.toPng(element, {
      quality: 0.9,
      bgcolor: '#ffffff',
      style: {
        transform: 'none',
        margin: '0',
        padding: '0'
      }
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Добавляем поля
    const margin = 15;
    const contentWidth = pdfWidth - (2 * margin);
    
    const ratio = contentWidth / imgProps.width;
    const imgWidth = contentWidth;
    const imgHeight = imgProps.height * ratio;

    // Разбиваем на страницы с полями
    let heightLeft = imgHeight;
    let position = margin;
    let pageNumber = 1;

    // Первая страница
    pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - (2 * margin));

    // Добавляем дополнительные страницы если нужно
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (2 * margin));
      pageNumber++;
    }

    const fileName = `${document.name || 'document'}.pdf`;
    pdf.save(fileName);
    console.log(`Fallback PDF generated with ${pageNumber} pages`);
  };

  useEffect(() => {
    const loadDocument = async () => {
      if (params.id) {
        console.log("[v0] Loading document:", params.id);
        const doc = await getDocument(params.id as string);
        setDocument(doc);

        if (doc?.project_id) {
          const proj = await getProject(doc.project_id);
          setProject(proj);
        }

        setLoading(false);
      }
    };

    loadDocument();
  }, [params.id]);

  const handleShare = async () => {
    const shareLink = `${window.location.origin}/document/${document?.id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log("Document link copied to clipboard");
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка документа...</span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Документ не найден</h2>
          <Button onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="md:inline hidden">Назад к проекту</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">ALLUNA</h1>
            </div>
            <div className="flex items-center md:flex-row md:space-x-2 flex-col">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="relative bg-transparent md:min-w-auto min-w-[120px]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 md:mr-2 text-green-600" />
                    <span className="hidden md:inline">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Скопировать ссылку</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="md:min-w-auto min-w-[120px]"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 md:mr-2" />
                )}
                <span className="hidden md:inline">
                  {isGeneratingPdf ? "Генерация PDF..." : (document.file_url ? "Открыть документ" : "Скачать PDF")}
                </span>
              </Button>
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">Д</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {document.name}
                </h2>
                {getStatusBadge(document.status)}
              </div>
              <p className="text-gray-600">
                {getDocumentTypeLabel(document.type)} • Проект:{" "}
                {project?.name || "Неизвестный проект"}
              </p>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Создан</p>
                    <p className="text-gray-900">
                      {new Date(document.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {document.signed_at && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Подписан
                      </p>
                      <p className="text-gray-900">
                        {new Date(document.signed_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Клиент</p>
                    <p className="text-gray-900">
                      {project?.client_name || "Неизвестно"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Контакт</p>
                    <p className="text-gray-900">
                      {project?.client_phone || "Неизвестно"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Content */}
        {document.file_url ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Загруженный документ
                </h3>
                <p className="text-gray-600">
                  Документ "{document.name}" готов для просмотра
                </p>
              </div>

              {/* PDF Preview for PDF files */}
              {document.file_url.toLowerCase().includes(".pdf") && (
                <div className="mb-6">
                  <iframe
                    src={document.file_url}
                    className="w-full h-96 border rounded-lg"
                    title="Document Preview"
                  />
                </div>
              )}

              <div className="flex justify-center gap-4 md:flex-row flex-col">
                <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingPdf ? "Генерация..." : "Открыть документ"}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Скопировать ссылку
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : document.type === "contract" && document.content ? (
          <ContractPreview
            contractData={JSON.parse(document.content)}
            onDownload={handleDownloadPdf}
            isReadOnly={true}
            ref={printRef}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Просмотр документа
              </h3>
              <p className="text-gray-600 mb-6">
                Документ "{document?.name}" готов для просмотра
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingPdf ? "Генерация PDF..." : "Скачать PDF"}
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Скопировать ссылку
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}