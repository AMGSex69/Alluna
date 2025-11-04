// lib/fonts/dejavu-sans.ts
export const DejaVuSansBase64 = 'AAEAAAASAQA...'; // ваша base64 строка

// Убедитесь, что функция экспортируется
export function registerDejaVuSans(doc: any) {
  try {
    console.log("Registering DejaVuSans font...");
    doc.addFileToVFS('DejaVuSans.ttf', DejaVuSansBase64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    console.log("Font registered successfully");
    return doc;
  } catch (error) {
    console.error("Error registering font:", error);
    throw error;
  }
}

// Добавьте default export для совместимости
export default {
  registerDejaVuSans,
  DejaVuSansBase64
};