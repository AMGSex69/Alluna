"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, ExternalLink, Copy, Calendar, User, Phone, Loader2, Check } from "lucide-react"
import { ContractPreview } from "@/components/contract-preview"
import { getDocument, getProject } from "@/lib/projects"
import type { Document, Project } from "@/lib/supabase/client"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "signed":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          Подписан
        </Badge>
      )
    case "pending_signature":
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Ожидает подписи
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="default" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Черновик
        </Badge>
      )
    default:
      return <Badge variant="secondary">Неизвестно</Badge>
  }
}

const getDocumentTypeLabel = (type: string) => {
  switch (type) {
    case "contract":
      return "Договор"
    case "attachment":
      return "Приложение"
    case "act":
      return "Акт"
    case "agreement":
      return "Дополнительное соглашение"
    case "invoice":
      return "Счет"
    default:
      return "Документ"
  }
}

export default function DocumentViewPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      if (params.id) {
        console.log("[v0] Loading document:", params.id)
        const doc = await getDocument(params.id as string)
        setDocument(doc)

        if (doc?.project_id) {
          const proj = await getProject(doc.project_id)
          setProject(proj)
        }

        setLoading(false)
      }
    }

    loadDocument()
  }, [params.id])

  const handleDownload = () => {
    if (document?.file_url) {
      window.open(document.file_url, "_blank")
    } else {
      console.log("Generating PDF for document:", document?.name)
    }
  }

  const handleShare = async () => {
    const shareLink = `${window.location.origin}/document/${document?.id}`
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Hide notification after 2 seconds
      console.log("Document link copied to clipboard")
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка документа...</span>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Документ не найден</h2>
          <Button onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к проекту
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">ALLUNA</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="relative bg-transparent">
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
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {document.file_url ? "Открыть документ" : "Скачать PDF"}
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">Д</span>
              </div>
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
                <h2 className="text-2xl font-bold text-gray-900">{document.name}</h2>
                {getStatusBadge(document.status)}
              </div>
              <p className="text-gray-600">
                {getDocumentTypeLabel(document.type)} • Проект: {project?.name || "Неизвестный проект"}
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
                    <p className="text-gray-900">{new Date(document.created_at).toLocaleDateString("ru-RU")}</p>
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
                      <p className="text-sm font-medium text-gray-600">Подписан</p>
                      <p className="text-gray-900">{new Date(document.signed_at).toLocaleDateString("ru-RU")}</p>
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
                    <p className="text-gray-900">{project?.client_name || "Неизвестно"}</p>
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
                    <p className="text-gray-900">{project?.client_phone || "Неизвестно"}</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Загруженный документ</h3>
                <p className="text-gray-600">Документ "{document.name}" готов для просмотра</p>
              </div>

              {/* PDF Preview for PDF files */}
              {document.file_url.toLowerCase().includes(".pdf") && (
                <div className="mb-6">
                  <iframe src={document.file_url} className="w-full h-96 border rounded-lg" title="Document Preview" />
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Button onClick={handleDownload}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть документ
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
          <ContractPreview contractData={JSON.parse(document.content)} onDownload={handleDownload} isReadOnly={true} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Просмотр документа</h3>
              <p className="text-gray-600 mb-6">Документ "{document?.name}" готов для просмотра</p>
              <div className="flex justify-center gap-4">
                <Button onClick={handleDownload}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть документ
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
  )
}
