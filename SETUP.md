# Инструкции за поставување

## 1. Supabase Setup

### Креирање на проект
1. Отидете на [supabase.com](https://supabase.com) и креирајте нов проект
2. Запишете го `Project URL` и `anon public key` од Settings > API

### Database Setup
1. Во Supabase Dashboard, отидете на SQL Editor
2. Копирајте го содржината од `supabase/schema.sql`
3. Извршете го SQL скриптот

### Креирање на прв администратор
1. Стартувајте го проектот: `npm run dev`
2. Отидете на `/register` и креирајте корисник
3. Во Supabase Dashboard:
   - Отидете на Authentication > Users
   - Најдете го вашиот корисник
   - Отидете на Table Editor > profiles
   - Најдете го вашиот запис и променете го `role` на `admin`

## 2. Environment Variables

Креирајте `.env.local` фајл:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 3. Инсталација

```bash
npm install
npm run dev
```

## 4. Тестирање

1. Најавете се како администратор
2. Тестирајте ги функционалностите:
   - Додавање на вработени
   - Поднесување барање за одмор
   - Одобрување/одбивање
   - Календар
   - PDF export

## Забелешки

- Admin user creation преку UI користи `signUp` метод кој бара email confirmation
- За production, размислете за користење на Supabase Admin API со service role key
- RLS policies се веќе поставени во schema.sql
