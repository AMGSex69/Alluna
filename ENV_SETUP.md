# Настройка переменных окружения

## 🚀 Быстрый старт

Скопируйте этот файл в `.env.local` в корне проекта:

```env
# OkiDoki API Configuration для электронного подписания  
OKIDOKI_BASE_URL=api.doki.online
OKIDOKI_API_KEY=67gZSOPuU6ahC5h3ZFTlICsjj1sBuMW-

# Environment variables for Next.js (client-side access)
NEXT_PUBLIC_OKIDOKI_BASE_URL=api.doki.online
NEXT_PUBLIC_OKIDOKI_API_KEY=67gZSOPuU6ahC5h3ZFTlICsjj1sBuMW-

# Use mock data instead of Supabase (set to 'false' to use Supabase)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Supabase Configuration (uncomment and configure when ready to use Supabase)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vercel Blob Storage (for file uploads)
# BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

## 📧 Режимы работы

### 🧪 Mock Data Mode (по умолчанию)
- `NEXT_PUBLIC_USE_MOCK_DATA=true`
- Использует тестовые данные
- Не требует Supabase
- OkiDoki API работает для Email подписания

### 🗄️ Supabase Mode  
- `NEXT_PUBLIC_USE_MOCK_DATA=false`
- Требует настройки Supabase
- Данные сохраняются в базе данных
- OkiDoki API работает для Email подписания

## 🔧 Команды для запуска

```bash
# Установка зависимостей
npm install

# Создание .env.local файла
cp ENV_SETUP.md .env.local
# Отредактируйте .env.local, скопировав содержимое из раздела "Быстрый старт"

# Запуск в режиме разработки
npm run dev
```

## 📧 Тестирование Email подписания

1. Запустите приложение: `npm run dev`
2. Откройте: `http://localhost:3000`
3. Создайте проект с **реальным email клиента**
4. Создайте документ
5. Отправьте на подпись - клиент получит email со ссылкой!

## 🎯 Что работает

✅ **Создание проектов и документов**  
✅ **Email подписание через OkiDoki**  
✅ **Mock данные для тестирования**  
✅ **Красивый UI с shadcn/ui**  
✅ **TypeScript поддержка**  

## 🔄 Переключение на Supabase

Когда будете готовы использовать Supabase:

1. Настройте Supabase проект
2. Добавьте URL и ключи в `.env.local`
3. Запустите SQL скрипты из папки `scripts/`
4. Измените `NEXT_PUBLIC_USE_MOCK_DATA=false`
5. Перезапустите приложение
