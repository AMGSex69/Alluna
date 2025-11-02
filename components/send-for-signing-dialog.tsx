"use client";

import type React from "react";

import { useState } from "react";
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
import { generateDocumentPDF } from "@/lib/podpislon-utils";

interface SendForSigningDialogProps {
  documentId: string;
  documentName: string;
  clientPhone: string;
  clientEmail?: string;
  clientName?: string;
  projectName?: string;
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

  const handleGeneratePDF = async () => {
    if (!name.trim() || !validateName(name)) {
      setError("Укажите корректное ФИО клиента");
      return;
    }

    setIsGeneratingPDF(true);
    setError("");

    try {
      console.log("Starting PDF generation...");
      const pdfData = await generateDocumentPDF({
        documentName,
        clientName: name,
        clientPhone: phone,
        clientEmail: email,
        projectName,
      });

      console.log("PDF generated, fromat:", pdfData.substring(0, 50));

      if (!pdfData || !pdfData.startsWith("data:application/pdf;base64,")) {
        throw new Error("Сгенерированный PDF имеет неверный формат");
      }

      setPdfPreview(pdfData);
    } catch (error) {
      console.error("PDF generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Ошибка при генерации PDF документа"
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfPreview) {
      const link = document.createElement("a");
      link.href = pdfPreview;
      link.download = `Договор_${documentName}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      link.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("ФИО клиента обязательно");
      return;
    }

    if (!validateName(name)) {
      setError("Укажите фамилию и имя клиента (минимум 2 слова)");
      return;
    }

    if (!phone.trim()) {
      setError("Номер телефона обязателен");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Некорректный формат телефона");
      return;
    }

    if (!email.trim()) {
      setError("Email обязателен для отправки документа");
      return;
    }

    if (!validateEmail(email)) {
      setError("Некорректный формат email");
      return;
    }

    if (!pdfPreview) {
      setError("Сначала сгенерируйте PDF документ");
      return;
    }

    if (
      !pdfPreview.startsWith("data:") &&
      !pdfPreview.startsWith("data:application/pdf")
    ) {
      setError(
        "Сгенерированный PDF имеет неверный формат. Попробуйте сгенерировать ещё раз."
      );
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
      <DialogContent className="sm:max-w-[600px]">
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

            {/* PDF Generation Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Генерация документа</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePDF}
                  disabled={
                    isGeneratingPDF ||
                    !name ||
                    !validateName(name) ||
                    !phone ||
                    !validatePhone(phone) ||
                    !email ||
                    !validateEmail(email)
                  }
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

              {!pdfPreview && (
                <p className="text-sm text-muted-foreground">
                  Нажмите "Сгенерировать PDF" чтобы создать документ для
                  подписания
                </p>
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
