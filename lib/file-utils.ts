// /lib/file-utils.ts
/**
 * Конвертирует файл в base64 для отправки в API
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

/**
 * Проверяет и форматирует телефон согласно требованиям Podpislon
 */
export function formatPhoneForPodpislon(phone: string): string {
  if (!phone) return ''
  
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 11 && digits.startsWith('8')) {
    return '+7' + digits.slice(1)
  } else if (digits.length === 11 && digits.startsWith('7')) {
    return '+' + digits
  } else if (digits.length === 10) {
    return '+7' + digits
  }
  
  return phone
}

/**
 * Разбирает полное имя на компоненты для Podpislon
 */
export function splitName(fullName: string): { lastName: string; firstName: string; middleName?: string } {
  const parts = fullName.trim().split(/\s+/)
  
  if (parts.length === 1) {
    return { lastName: parts[0], firstName: '' }
  } else if (parts.length === 2) {
    return { lastName: parts[0], firstName: parts[1] }
  } else {
    return { 
      lastName: parts[0], 
      firstName: parts[1], 
      middleName: parts.slice(2).join(' ') 
    }
  }
}