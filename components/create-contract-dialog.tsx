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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, Loader2 } from "lucide-react"

interface CreateContractDialogProps {
  projectData: {
    name: string
    client: string
    clientPhone: string
    description: string
  }
  onCreateContract: (contractData: {
    projectName: string
    clientName: string
    clientPhone: string
    projectDescription: string
    totalAmount: string
    advancePayment: string
    workPeriod: string
    additionalTerms: string
  }) => Promise<void> | void
  trigger?: React.ReactNode
}

export function CreateContractDialog({ projectData, onCreateContract, trigger }: CreateContractDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    totalAmount: "",
    advancePayment: "",
    workPeriod: "30",
    additionalTerms: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.totalAmount && formData.advancePayment && !loading) {
      setLoading(true)
      try {
        await onCreateContract({
          projectName: projectData.name,
          clientName: projectData.client,
          clientPhone: projectData.clientPhone,
          projectDescription: projectData.description,
          ...formData,
        })
        setFormData({
          totalAmount: "",
          advancePayment: "",
          workPeriod: "30",
          additionalTerms: "",
        })
        setOpen(false)
      } catch (error) {
        console.error("Error creating contract:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать договор
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Создать договор на дизайн-проект
          </DialogTitle>
          <DialogDescription>
            Заполните условия договора. Данные проекта и клиента будут подставлены автоматически.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Project Info Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Информация из проекта</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Проект:</span>
                  <p className="font-medium">{projectData.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Клиент:</span>
                  <p className="font-medium">{projectData.client}</p>
                </div>
                <div>
                  <span className="text-gray-600">Телефон:</span>
                  <p className="font-medium">{projectData.clientPhone}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contract Terms */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Условия договора</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="totalAmount">Общая стоимость (руб.) *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange("totalAmount", e.target.value)}
                    placeholder="150000"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="advancePayment">Предоплата (руб.) *</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => handleInputChange("advancePayment", e.target.value)}
                    placeholder="75000"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workPeriod">Срок выполнения (дней)</Label>
                <Input
                  id="workPeriod"
                  type="number"
                  value={formData.workPeriod}
                  onChange={(e) => handleInputChange("workPeriod", e.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="additionalTerms">Дополнительные условия</Label>
                <Textarea
                  id="additionalTerms"
                  value={formData.additionalTerms}
                  onChange={(e) => handleInputChange("additionalTerms", e.target.value)}
                  placeholder="Укажите особые условия договора..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать договор"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
