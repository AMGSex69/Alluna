"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Phone,
  Clock,
  CheckCircle,
  Loader2,
  ExternalLink,
  Mail,
} from "lucide-react";
import { CreateContractDialog } from "@/components/create-contract-dialog";
import { SendForSigningDialog } from "@/components/send-for-signing-dialog";
import { UploadDocumentDialog } from "@/components/upload-document-dialog";

import {
  getProject,
  getProjectDocuments,
  createDocument,
  updateDocumentStatus,
  deleteDocument,
  type DocumentWithIntegration,
} from "@/lib/projects";
import type { Project } from "@/lib/supabase/client";

/* ---------------- helpers ---------------- */

function getStatusBadge(status: string) {
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
}

function getStatusIcon(status: string) {
  switch (status) {
    case "signed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending_signature":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
  }
}

function getDocumentTypeLabel(type: string) {
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
}

/** Маппинг статусов Подпислона в локальные */
// function mapPodpislonToLocalStatus(
//   status: string | undefined
// ): "pending_signature" | "signed" | "draft" | "unknown" {
//   const s = String(status || "").toLowerCase();

//   // Статусы Podpislon
//   if (s === "30" || s === "signed" || s === "подписан") {
//     return "signed";
//   }
//   if (
//     s === "10" ||
//     s === "15" ||
//     s === "pending" ||
//     s === "создан" ||
//     s === "отправлен"
//   ) {
//     return "pending_signature";
//   }
//   if (s === "draft" || s === "черновик") {
//     return "draft";
//   }
//   return "unknown";
// }

/* ============================================================ */

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentWithIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  /* -------- загрузка проекта и документов -------- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, docs] = await Promise.all([
          getProject(projectId),
          getProjectDocuments(projectId),
        ]);

        if (!p) {
          console.error(
            "❌ [ProjectPage] Project not found for ID:",
            projectId
          );
          setError("Проект не найден");
          return;
        }

        setProject(p);
        setDocuments(docs);
      } catch (e) {
        console.error("❌ [ProjectPage] Load error:", e);
        setError("Ошибка загрузки данных проекта");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      load();
    } else {
      console.error("❌ [ProjectPage] No projectId provided");
      setError("ID проекта не указан");
    }
  }, [projectId]);

  // Функция для перезагрузки документов
  const reloadDocuments = async () => {
  try {
    console.log("[reloadDocuments] Reloading documents for project:", projectId);
    const docs = await getProjectDocuments(projectId);
    console.log("[reloadDocuments] Loaded documents:", docs.length);
    
    // Проверяем статусы загруженных документов
    docs.forEach(doc => {
      console.log(`[reloadDocuments] Document ${doc.id}: ${doc.name} - Status: ${doc.status}, Podpislon ID: ${doc.podpislon_id}`);
    });
    
    setDocuments(docs);
  } catch (error) {
    console.error("❌ [reloadDocuments] Error:", error);
  }
};

  /* -------- создание черновика договора (старый флоу) -------- */
  const handleCreateContract = async (contractData: any) => {
    if (!project) {
      console.error("❌ [handleCreateContract] Project is null");
      return;
    }

    try {
      const response = await fetch("/api/documents/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: project.id,
          name: `Договор на дизайн-проект №ДП-${Date.now()
            .toString()
            .slice(-6)}`,
          type: "contract",
          status: "draft",
          content: JSON.stringify(contractData),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create document");
      }

      if (result.data) {
        // Обновляем состояние
        setDocuments((prev) => {
          const newDocuments = [result.data, ...prev];
          return newDocuments;
        });

        // Проверяем обновление состояния
        setTimeout(() => {
          console.log(
            "⏰ [handleCreateContract] Documents state after update (timeout):",
            documents.length
          );
        }, 100);
      } else {
        throw new Error("No data returned from API");
      }
    } catch (error: any) {
      console.error("❌ [handleCreateContract] Error:", error);
      alert("Произошла ошибка при создании документа: " + error.message);
    }
  };

  /* -------- удаление -------- */
  const handleDeleteDocument = async (
    documentId: string,
    documentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!confirm(`Удалить документ "${documentName}"?`)) return;
    try {
      const ok = await deleteDocument(documentId);
      if (ok) setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      else alert("Не удалось удалить документ. Попробуйте ещё раз.");
    } catch {
      alert("Произошла ошибка при удалении документа.");
    }
  };

  /* -------- НОВЫЙ ФЛОУ: Отправка на подписание через Podpislon -------- */
  const handleSendForSigning = async (data: {
    document_id: string;
    document_name: string;
    signer: {
      name: string;
      email: string;
      phone: string;
    };
    file_data: string; // base64 PDF
  }) => {
    if (!project) return;

    try {
      console.log("[handleSendForSigning] Starting with data:", {
        document_id: data.document_id,
        document_name: data.document_name,
        signer: data.signer,
      });

      const response = await fetch("/api/podpislon/send-for-signing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.details || "Failed to send for signing"
        );
      }

      console.log("[handleSendForSigning] Podpislon response:", result);

      console.log("[handleSendForSigning] Reloading documents after successful sending");
    await reloadDocuments();


      alert(
        `✅ ${
          result.message || "Документ отправлен на подпись!"
        }\n\nСсылка для подписания: ${result.signing_url || result.link}`
      );
      return result;
    } catch (error) {
      console.error("[send-for-signing] error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла ошибка при отправке документа";
      alert(`❌ ${errorMessage}`);
      throw error;
    }
  };

  // Функция для обновления статуса документа после успешной отправки
  const handleSendForSigningSuccess = () => {
    console.log("[handleSendForSigningSuccess] Reloading documents...");
    reloadDocuments();
  };

  useEffect(() => {
    console.log("[ProjectPage] document state updated:", {
      count: documents.length,
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        podpislon_id: d.podpislon_id,
        created_at: d.created_at,
      })),
    });
  }, [documents]);

  /* -------- новый флоу: создание в Подпислоне из диалога загрузки -------- */
  const handleUploadDocument = async (documentData: {
    type: string;
    file?: File;
    file_url?: string;
    phone?: string;
    email?: string;
    createdId?: number | string;
    signUrl?: string | null;
  }) => {
    if (!project) return;

    const doc = await createDocument({
      project_id: project.id,
      name: documentData.file?.name || `Документ ${documents.length + 1}`,
      type: (documentData.type as any) ?? "other",
      status: "pending_signature",
      file_url: documentData.file_url ?? null,
      podpislon_id: documentData.createdId ?? null,
      sign_url: documentData.signUrl ?? null,
    });

    if (doc) setDocuments((prev) => [doc, ...prev]);
  };

  /* -------- автопуллинг статусов из Подпислона -------- */
  const pollingList = useMemo(
  () => documents.filter((d) => d.podpislon_id && d.status !== "signed"),
  [documents]
);

useEffect(() => {
  const pollingList = documents.filter((d) => 
    d.podpislon_id && 
    d.status !== "signed" // Опрашиваем только неподписанные документы
  );

  if (pollingList.length === 0) {
    console.log("[Status Poll] No documents to poll");
    return;
  }
  
  let stopped = false;
  const INTERVAL = 30000; // 30 секунд

  async function checkDocumentStatus(doc: DocumentWithIntegration) {
    try {
      const podpislonId = String(doc.podpislon_id);
      console.log(`[Status Poll] Checking status for document ${doc.id}, podpislon_id: ${podpislonId}, current status: ${doc.status}`);

      const res = await fetch(
        `/api/podpislon/status/${encodeURIComponent(podpislonId)}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      console.log(`[Status Poll] Status for document ${doc.id}:`, {
        current: doc.status,
        new: data.status,
        signedAt: data.signedAt
      });

      return {
        id: doc.id,
        podpislonId: podpislonId,
        status: data?.status || "unknown",
        signedAt: data?.signedAt || null,
        statusText: data?.statusText || "",
      };
    } catch (error) {
      console.error(`[Status Poll] Error checking document ${doc.id}:`, error);
      return null;
    }
  }

  async function tick() {
    if (stopped) return;

    try {
      console.log(
        "[Status Poll] Checking status for documents:",
        pollingList.map((d) => ({
          id: d.id,
          name: d.name,
          podpislon_id: d.podpislon_id,
          current_status: d.status,
        }))
      );

      const results = await Promise.allSettled(
        pollingList.map(checkDocumentStatus)
      );

      if (stopped) return;

      const updates: Array<{
        id: string;
        podpislonId: string;
        newStatus: "signed" | "pending_signature" | "draft";
        signedAt?: string | null;
        statusText?: string;
      }> = [];

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const { id, podpislonId, status, signedAt, statusText } = result.value;
          
          // Обновляем только если статус изменился и он валидный
          if (status !== "unknown") {
            const currentDoc = documents.find(d => d.id === id);
            if (currentDoc && currentDoc.status !== status) {
              updates.push({
                id,
                podpislonId,
                newStatus: status as "signed" | "pending_signature" | "draft",
                signedAt: status === "signed" ? (signedAt || new Date().toISOString()) : undefined,
                statusText,
              });
              console.log(`[Status Poll] Document ${id} status changed: ${currentDoc.status} -> ${status}`);
            }
          }
        }
      }

      if (updates.length > 0) {
        console.log(`[Status Poll] Applying ${updates.length} status updates`);
        
        // Обновляем UI - БД уже обновлена через API статуса
        setDocuments((prev) =>
          prev.map((d) => {
            const update = updates.find((u) => u.id === d.id);
            if (!update) return d;
            
            const updatedDoc = {
              ...d,
              status: update.newStatus,
              signed_at: update.newStatus === "signed" 
                ? (update.signedAt || new Date().toISOString())
                : d.signed_at,
              updated_at: new Date().toISOString(),
            };
            
            console.log(`[Status Poll] Updated UI for document ${d.id}:`, {
              from: d.status,
              to: updatedDoc.status,
              signed_at: updatedDoc.signed_at
            });
            
            return updatedDoc;
          })
        );

        // Показываем уведомления о изменении статуса
        updates.forEach(update => {
          if (update.newStatus === "signed") {
            console.log(`[Status Poll] 🎉 Document ${update.id} is now signed!`);
            // Можно добавить toast-уведомление здесь
          }
        });
      } else {
        console.log("[Status Poll] No status updates needed");
      }
    } catch (e) {
      console.warn("[Status Poll] Polling error:", e);
    }
  }

  // Запускаем сразу и затем по интервалу
  console.log(`[Status Poll] Starting polling for ${pollingList.length} documents`);
  tick();
  const intervalId = setInterval(tick, INTERVAL);

  return () => {
    console.log("[Status Poll] Stopping polling");
    stopped = true;
    clearInterval(intervalId);
  };
}, [documents]);

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка проекта...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Проект не найден"}
          </h2>
          <Button onClick={() => router.push("/")} variant="outline">
            Вернуться к проектам
          </Button>
        </div>
      </div>
    );
  }

  const signedDocuments = documents.filter((d) => d.status === "signed");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">ALLUNA</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">Д</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
            </div>
          </div>

          {/* Client Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Имя клиента
                  </p>
                  <p className="text-gray-900">{project.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Телефон</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <p className="text-gray-900">{project.client_phone}</p>
                  </div>
                </div>
                {project.client_email && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-gray-900">{project.client_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access to Signed Documents */}
        {signedDocuments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Быстрый доступ к подписанным документам
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signedDocuments.map((d) => (
                <Card
                  key={`signed-${d.id}`}
                  className="hover:shadow-md transition-shadow cursor-pointer border-green-200"
                  onClick={() => router.push(`/document/${d.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {d.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Подписан{" "}
                          {d.signed_at
                            ? new Date(d.signed_at).toLocaleDateString("ru-RU")
                            : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Документы проекта
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Договоры, приложения и акты по этапам
              </p>
            </div>
            <div className="flex lg:gap-2 lg:flex-row flex-col">
              <CreateContractDialog
                projectData={{
                  name: project.name,
                  client: project.client_name,
                  clientPhone: project.client_phone,
                  description: project.description || "",
                }}
                onCreateContract={handleCreateContract}
              />
              <UploadDocumentDialog
                onUploadDocument={handleUploadDocument}
                // Добавляем данные клиента для предзаполнения
                clientName={project.client_name}
                clientPhone={project.client_phone}
                clientEmail={project.client_email}
              />
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {documents.map((d) => {
              const podpislonId = d.podpislon_id;
              const signUrl = d.sign_url;

              return (
                <Card key={d.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(d.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {d.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {getDocumentTypeLabel(d.type)} • Создан{" "}
                            {new Date(d.created_at).toLocaleDateString("ru-RU")}
                            {d.signed_at && (
                              <>
                                {" "}
                                • Подписан{" "}
                                {new Date(d.signed_at).toLocaleDateString(
                                  "ru-RU"
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center lg:flex-row lg:gap-3 flex-col">
                        {getStatusBadge(d.status)}

                        {/* Если ждём подписи и есть ссылка — кнопка открытия страницы Подпислона */}
                        {d.status === "pending_signature" && signUrl && (
                          <a
                            href={signUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md"
                          >
                            Открыть страницу подписи{" "}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {/* Для draft — НОВЫЙ диалог отправки на подпись */}
                        {d.status === "draft" && (
                          <SendForSigningDialog
                            documentId={d.id} // Добавляем ID документа
                            documentName={d.name}
                            clientPhone={project.client_phone}
                            clientEmail={project.client_email}
                            clientName={project.client_name} // Добавляем имя клиента
                            projectName={project.name}
                            documentContent={d.content}
                            onSendForSigning={handleSendForSigning}
                            onSuccess={handleSendForSigningSuccess} // Добавляем callback успеха
                          />
                        )}

                        {d.status === "pending_signature" && (
                          <Badge
                            variant="outline"
                            className="text-yellow-700 border-yellow-300"
                          >
                            Отправлен клиенту
                          </Badge>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/document/${d.id}`)}
                        >
                          Просмотр
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDeleteDocument(d.id, d.name, e)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-700"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {documents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пока нет документов
              </h3>
              <p className="text-gray-600 mb-6">
                Создайте первый документ для этого проекта
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}