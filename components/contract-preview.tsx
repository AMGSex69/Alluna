"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Send } from "lucide-react"

interface ContractData {
  projectName: string
  clientName: string
  clientPhone: string
  clientEmail: string
  projectDescription: string
  totalAmount: string
  advancePayment: string
  workPeriod: string
  additionalTerms: string
  contractNumber?: string
  createdAt?: string
}

interface ContractPreviewProps {
  contractData: ContractData
  onSendForSigning?: () => void
  onDownload?: () => void
  isReadOnly?: boolean
}

export function ContractPreview({
  contractData,
  onSendForSigning,
  onDownload,
  isReadOnly = false,
}: ContractPreviewProps) {
  const contractNumber = contractData.contractNumber || `ДП-${Date.now().toString().slice(-6)}`
  const contractDate = contractData.createdAt
    ? new Date(contractData.createdAt).toLocaleDateString("ru-RU")
    : new Date().toLocaleDateString("ru-RU")

  return (
    <div className="space-y-6">
      {/* Actions */}
      {!isReadOnly && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Предварительный просмотр договора</h3>
          <div className="flex gap-2">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Скачать PDF
              </Button>
            )}
            {onSendForSigning && (
              <Button size="sm" onClick={onSendForSigning}>
                <Send className="h-4 w-4 mr-2" />
                Отправить на подпись
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Contract Document */}
      <Card className="max-w-4xl">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl">ДОГОВОР НА ВЫПОЛНЕНИЕ ДИЗАЙН-ПРОЕКТА ИНТЕРЬЕРА</CardTitle>
          <p className="text-sm text-gray-600">
            № {contractNumber} от {contractDate}
          </p>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Parties */}
          <div>
            <h4 className="font-semibold mb-3">1. СТОРОНЫ ДОГОВОРА</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium">ИСПОЛНИТЕЛЬ:</p>
                <p className="text-sm text-gray-700 mt-1">
                  Индивидуальный предприниматель
                  <br />
                  [Ваши данные]
                  <br />
                  ИНН: [ИНН]
                  <br />
                  Адрес: [Адрес]
                </p>
              </div>
              <div>
                <p className="font-medium">ЗАКАЗЧИК:</p>
                <p className="text-sm text-gray-700 mt-1">
                  {contractData.clientName}
                  <br />
                  Тел.: {contractData.clientPhone}
                  <br />
                  Email: {contractData.clientEmail}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subject */}
          <div>
            <h4 className="font-semibold mb-3">2. ПРЕДМЕТ ДОГОВОРА</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              Исполнитель обязуется выполнить дизайн-проект интерьера объекта "{contractData.projectName}" в
              соответствии с техническим заданием и пожеланиями Заказчика, а Заказчик обязуется принять выполненную
              работу и оплатить ее в порядке и сроки, установленные настоящим договором.
            </p>
            {contractData.projectDescription && (
              <div className="mt-3">
                <p className="font-medium text-sm">Описание проекта:</p>
                <p className="text-sm text-gray-700">{contractData.projectDescription}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Cost and Payment */}
          <div>
            <h4 className="font-semibold mb-3">3. СТОИМОСТЬ И ПОРЯДОК РАСЧЕТОВ</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                3.1. Общая стоимость работ составляет:{" "}
                <span className="font-medium">{Number(contractData.totalAmount).toLocaleString("ru-RU")} (рублей)</span>
              </p>
              <p>
                3.2. Предоплата:{" "}
                <span className="font-medium">
                  {Number(contractData.advancePayment).toLocaleString("ru-RU")} рублей
                </span>{" "}
                - вносится в течение 3 дней после подписания договора
              </p>
              <p>
                3.3. Оставшаяся сумма:{" "}
                <span className="font-medium">
                  {(Number(contractData.totalAmount) - Number(contractData.advancePayment)).toLocaleString("ru-RU")}{" "}
                  рублей
                </span>{" "}
                - оплачивается после сдачи готового проекта
              </p>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h4 className="font-semibold mb-3">4. СРОКИ ВЫПОЛНЕНИЯ</h4>
            <p className="text-sm text-gray-700">
              4.1. Срок выполнения дизайн-проекта:{" "}
              <span className="font-medium">{contractData.workPeriod} календарных дней</span> с момента внесения
              предоплаты и утверждения технического задания.
            </p>
          </div>

          <Separator />

          {/* Additional Terms */}
          {contractData.additionalTerms && (
            <>
              <div>
                <h4 className="font-semibold mb-3">5. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{contractData.additionalTerms}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Standard Terms */}
          <div>
            <h4 className="font-semibold mb-3">{contractData.additionalTerms ? "6" : "5"}. ОБЩИЕ ПОЛОЖЕНИЯ</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Договор вступает в силу с момента подписания обеими сторонами</p>
              <p>• Все изменения и дополнения к договору оформляются письменно</p>
              <p>• Споры разрешаются путем переговоров, при недостижении согласия - в судебном порядке</p>
            </div>
          </div>

          <Separator />

          {/* Signatures */}
          <div>
            <h4 className="font-semibold mb-4">ПОДПИСИ СТОРОН</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="font-medium mb-4">ИСПОЛНИТЕЛЬ:</p>
                <div className="border-b border-gray-300 h-12 mb-2"></div>
                <p className="text-xs text-gray-600">подпись / расшифровка</p>
              </div>
              <div>
                <p className="font-medium mb-4">ЗАКАЗЧИК:</p>
                <div className="border-b border-gray-300 h-12 mb-2"></div>
                <p className="text-xs text-gray-600">подпись / расшифровка</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
