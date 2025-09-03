"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Plus, Loader2 } from "lucide-react"

interface UploadDocumentDialogProps {
  onUploadDocument: (documentData: {
    type: string
    file?: File
    file_url?: string
  }) => Promise<void> | void
  trigger?: React.ReactNode
}

export function UploadDocumentDialog({ onUploadDocument, trigger }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (documentType && !loading) {
      setLoading(true)
      try {
        let fileUrl: string | undefined

        if (selectedFile) {
          console.log("[v0] Uploading file to Blob storage:", selectedFile.name)

          const formData = new FormData()
          formData.append("file", selectedFile)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload file")
          }

          const result = await response.json()
          fileUrl = result.url
          console.log("[v0] File uploaded successfully:", fileUrl)
        }

        await onUploadDocument({
          type: documentType,
          file: selectedFile || undefined,
          file_url: fileUrl,
        })
        setDocumentType("")
        setSelectedFile(null)
        setOpen(false)
      } catch (error) {
        console.error("Error uploading document:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    const fileInput = document.getElementById("file-input") as HTMLInputElement
    fileInput?.click()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Добавить документ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Добавить документ
          </DialogTitle>
          <DialogDescription>Загрузите дополнительный документ к проекту</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Document Type Selection */}
            <div className="grid gap-2">
              <Label htmlFor="type">Тип документа *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип документа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="act">Акт выполненных работ</SelectItem>
                  <SelectItem value="attachment">Приложение к договору</SelectItem>
                  <SelectItem value="agreement">Дополнительное соглашение</SelectItem>
                  <SelectItem value="invoice">Счет на оплату</SelectItem>
                  <SelectItem value="other">Другой документ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div className="grid gap-2">
              <Label>Файл документа</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : selectedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-sm text-green-700">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Перетащите файл сюда или</p>
                    <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>
                      Выберите файл
                    </Button>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx"
              />
              <p className="text-xs text-gray-600">Поддерживаемые форматы: PDF, DOC, DOCX (макс. 10 МБ)</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={!documentType || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Добавить документ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
