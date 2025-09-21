# 🏠 ALLUNA - Система управления дизайн-проектами

Современное веб-приложение для управления дизайн-проектами интерьеров с интегрированной системой электронного подписания документов.

## ✨ Особенности

- 🎨 **Управление дизайн-проектами** - создание и отслеживание проектов интерьеров
- 📄 **Управление документами** - договоры, акты, приложения с отслеживанием статусов
- ✍️ **Электронное подписание** - интеграция с OkiDoki API для Email-подписания
- 🧪 **Гибкие режимы работы** - Mock данные для тестирования или Supabase для продакшена
- 📱 **Адаптивный дизайн** - работает на всех устройствах
- 🚀 **Современный стек** - Next.js 15, React 19, TypeScript, Tailwind CSS

## 🛠️ Технологии

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Vercel Blob
- **E-Signing:** OkiDoki API
- **Icons:** Lucide React

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# OkiDoki API Configuration для электронного подписания  
OKIDOKI_BASE_URL=<okidoki_api_base_url>
OKIDOKI_API_KEY=<okidoki_api_key>

# Environment variables for Next.js (client-side access)
NEXT_PUBLIC_OKIDOKI_BASE_URL=<optional_public_base_url>
NEXT_PUBLIC_OKIDOKI_API_KEY=<never_set_api_key_here>

# Use mock data instead of Supabase (set to 'false' to use Supabase)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Supabase Configuration (uncomment when ready to use)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vercel Blob Storage (for file uploads)
# BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 3. Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📧 Тестирование Email-подписания

1. Запустите приложение: `npm run dev`
2. Создайте проект с **реальным email клиента**
3. Создайте документ (договор)
4. Отправьте на подпись - **клиент получит email со ссылкой!**

## 📁 Структура проекта

```
├── app/                    # Next.js App Router
│   ├── api/okidoki/       # OkiDoki API endpoints
│   ├── project/[id]/      # Страница проекта
│   ├── sign/[documentId]/ # Страница подписания
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── ui/               # shadcn/ui компоненты
│   └── *.tsx             # Основные компоненты
├── lib/                  # Утилиты и API
│   ├── okidoki-api.ts    # OkiDoki API клиент
│   ├── projects.ts       # Логика проектов
│   └── mock-data.ts      # Тестовые данные
└── scripts/              # SQL скрипты для Supabase
```

## 🎯 Основные функции

### ✅ Управление проектами
- Создание проектов с данными клиента
- Просмотр списка всех проектов  
- Удаление проектов с подтверждением
- Детальная информация по проектам

### ✅ Управление документами
- Создание документов (договоры, акты, приложения)
- Загрузка файлов документов
- Отслеживание статусов: `draft` → `pending_signature` → `signed`
- Просмотр документов по проектам

### ✅ Электронное подписание
- **Email-подписание** через OkiDoki API
- Красивые HTML-шаблоны договоров в email
- Автоматическая отправка на email клиента
- Callback обработка статусов подписания
- Упрощенный процесс для клиентов

## 🔄 Режимы работы

### 🧪 Mock Data Mode (по умолчанию)
- `NEXT_PUBLIC_USE_MOCK_DATA=true`
- Использует тестовые данные
- Не требует настройки Supabase
- OkiDoki API работает для Email подписания

### 🗄️ Supabase Mode
- `NEXT_PUBLIC_USE_MOCK_DATA=false`
- Требует настройки Supabase
- Данные сохраняются в базе данных
- Запустите SQL скрипты из папки `scripts/`

## 🌟 Интеграция OkiDoki API

Приложение полностью интегрировано с OkiDoki API для электронного подписания:

- ✅ Email-уведомления клиентам
- ✅ HTML-шаблоны договоров
- ✅ Автоматические callback'и статусов
- ✅ Безопасные server-side endpoints

**API Endpoint:** `api.doki.online`  
**Поддержка:** +79397163709, https://t.me/superpupermegaman

## 📝 Скрипты

```bash
# Разработка
npm run dev

# Продакшен
npm run build
npm run start

# Линтинг
npm run lint
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

Этот проект создан для демонстрации возможностей современной веб-разработки с интеграцией электронного подписания.

---

**🎉 Проект готов к использованию!**

Создан с ❤️ для эффективного управления дизайн-проектами интерьеров.
