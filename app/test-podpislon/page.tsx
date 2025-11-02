// app/test-real-flow/page.tsx
"use client";

import { useState } from "react";

export default function TestRealFlow() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRealFlow = async () => {
    setLoading(true);
    try {
      // Используем реальный PDF из вашей системы
      const pdfResponse = await fetch("/api/podpislon/generate-test-pdf");
      const pdfData = await pdfResponse.json();

      const response = await fetch("/api/podpislon/send-for-signing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: "test-real-" + Date.now(),
          document_name: "Реальный тестовый договор",
          signer: {
            name: "Иванов Иван Иванович",
            email: "test@example.com",
            phone: "+79123456789",
          },
          file_data: pdfData.pdf, // или pdfData.file_data в зависимости от вашего API
        }),
      });

      const data = await response.json();
      setResult(data);

      // Если успешно, проверяем статус через 5 секунд
      if (data.success && data.signing_id) {
        setTimeout(() => {
          checkStatus(data.signing_id);
        }, 5000);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (documentId: string) => {
    try {
      const response = await fetch(`/api/podpislon/status/${documentId}`);
      const statusData = await response.json();
      setResult((prev) => ({ ...prev, statusCheck: statusData }));
    } catch (error: any) {
      console.error("Status check failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Тестирование реального workflow Podpislon</h1>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#e3f2fd",
          borderRadius: "5px",
        }}
      >
        <h3>Текущий режим: REAL</h3>
        <p>Проверьте что в .env.local установлено:</p>
        <code>PODPISLON_API_MODE=real</code>
      </div>

      <button
        onClick={testRealFlow}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading
          ? "Отправка в Podpislon..."
          : "Протестировать реальную отправку"}
      </button>

      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: result.error ? "#ffebee" : "#e8f5e8",
            borderRadius: "5px",
          }}
        >
          <h3>Результат:</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
