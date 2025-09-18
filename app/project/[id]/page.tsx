"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { CreateContractDialog } from "@/components/create-contract-dialog";
import { SendForSigningDialog } from "@/components/send-for-signing-dialog";
import { UploadDocumentDialog } from "@/components/upload-document-dialog";
import {
  getProject,
  getProjectDocuments,
  createDocument,
  updateDocumentStatus,
} from "@/lib/projects";
import type { Project, Document } from "@/lib/supabase/client";

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
    case "draft":
      return (
        <Badge
          variant="default"
          className="bg-gray-100 text-gray-800 hover:bg-gray-100"
        >
          Черновик
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
    default:
      return <Badge variant="secondary">Неизвестно</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "signed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending_signature":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "draft":
      return <FileText className="h-4 w-4 text-gray-600" />;
    default:
      return <FileText className="h-4 w-4 text-gray-600" />;
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

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  useEffect(() => {
    const loadProjectData = async () => {
      console.log("[v0] Loading project data for ID:", projectId);
      setLoading(true);
      setError(null);

      try {
        const [projectData, documentsData] = await Promise.all([
          getProject(projectId),
          getProjectDocuments(projectId),
        ]);

        if (!projectData) {
          setError("Проект не найден");
          return;
        }

        setProject(projectData);
        setDocuments(documentsData);
        console.log("[v0] Project loaded:", projectData.name);
        console.log("[v0] Documents loaded:", documentsData.length);
      } catch (err) {
        console.error("[v0] Error loading project data:", err);
        setError("Ошибка загрузки данных проекта");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const handleCreateContract = async (contractData: any) => {
    if (!project) return;

    console.log("[v0] Creating contract for project:", project.id);

    const contractDocument = await createDocument({
      project_id: project.id,
      name: `Договор на дизайн-проект №ДП-${Date.now().toString().slice(-6)}`,
      type: "contract",
      status: "draft",
      content: JSON.stringify(contractData),
    });

    if (contractDocument) {
      setDocuments((prev) => [contractDocument, ...prev]);
      console.log("[v0] Contract created successfully");
    }
  };

  const handleSendForSigning = async (
    documentId: string,
    phone: string,
    email?: string
  ) => {
    console.log("[v0] Sending document for signing via Email:", documentId, {
      phone,
      email,
    });

    if (!email) {
      alert("Email обязателен для отправки документа на подписание");
      return;
    }

    try {
      // Find the document
      const document = documents.find((doc) => doc.id === documentId);
      if (!document || !project) {
        console.error("[v0] Document or project not found");
        return;
      }

      // Send for signing using OkiDoki API
      const response = await fetch("/api/okidoki/send-for-signing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: documentId,
          document_name: document.name,
          document_url: document.file_url || `/api/documents/${documentId}`,
          signer: {
            name: project.client_name,
            phone: phone,
            email: email,
          },
          metadata: {
            projectId: project.id,
            projectName: project.name,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[v0] Document sent successfully:", data);

        // Update document status
        const success = await updateDocumentStatus(
          documentId,
          "pending_signature"
        );

        if (success) {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === documentId
                ? { ...doc, status: "pending_signature" as const }
                : doc
            )
          );

          console.log(
            `[v0] Email sent to ${email}: Ссылка для подписания отправлена`
          );
          alert(`Документ отправлен на подпись! Email отправлен на ${email}`);
        }
      } else {
        const errorData = await response.text();
        console.error("[v0] Error sending document:", errorData);
        alert("Ошибка при отправке документа на подпись");
      }
    } catch (error) {
      console.error("[v0] Error in handleSendForSigning:", error);
      alert("Произошла ошибка при отправке документа");
    }
  };

  const handleUploadDocument = async (documentData: {
    type: string;
    file?: File;
    file_url?: string; // Added file_url parameter
  }) => {
    if (!project) return;

    console.log("[v0] Uploading document for project:", project.id);
    console.log("[v0] Creating document with file_url:", documentData.file_url);

    const newDocument = await createDocument({
      project_id: project.id,
      name: documentData.file?.name || `Документ ${documents.length + 1}`,
      type: documentData.type as "contract" | "act" | "appendix" | "agreement",
      status: "draft",
      file_url: documentData.file_url, // Use the correct file_url from Blob storage
    });

    if (newDocument) {
      setDocuments((prev) => [newDocument, ...prev]);
      console.log("[v0] Document uploaded successfully");
    }
  };

  const handleDocumentClick = (documentId: string) => {
    router.push(`/document/${documentId}`);
  };

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

  // Quick access to signed documents
  const signedDocuments = documents.filter((doc) => doc.status === "signed");

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
              {signedDocuments.map((document) => (
                <Card
                  key={`signed-${document.id}`}
                  className="hover:shadow-md transition-shadow cursor-pointer border-green-200"
                  onClick={() => handleDocumentClick(document.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Подписан{" "}
                          {document.signed_at
                            ? new Date(document.signed_at).toLocaleDateString(
                                "ru-RU"
                              )
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
              <UploadDocumentDialog onUploadDocument={handleUploadDocument} />
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {documents.map((document) => (
              <Card
                key={document.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(document.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {document.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getDocumentTypeLabel(document.type)} • Создан{" "}
                          {new Date(document.created_at).toLocaleDateString(
                            "ru-RU"
                          )}
                          {document.signed_at && (
                            <>
                              {" "}
                              • Подписан{" "}
                              {new Date(document.signed_at).toLocaleDateString(
                                "ru-RU"
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center lg:flex-row lg:gap-3 flex-col">
                      {getStatusBadge(document.status)}
                      {document.status === "draft" && (
                        <SendForSigningDialog
                          documentName={document.name}
                          clientPhone={project.client_phone}
                          clientEmail={project.client_email}
                          onSendForSigning={(phone, email) =>
                            handleSendForSigning(document.id, phone, email)
                          }
                        />
                      )}
                      {document.status === "pending_signature" && (
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
                        onClick={() => handleDocumentClick(document.id)}
                      >
                        Просмотр
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
