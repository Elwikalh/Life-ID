# Life ID — Monorepo (Phase 0 Starter)

منظومة Life ID الطبية الكاملة: تطبيق موبايل + منصة ويب + Backend API + قاعدة بيانات.

## الهيكل

```
life-id/
  apps/
    mobile/   # React Native (Expo) — مريض + مقدم خدمة
    web/      # Next.js 15 — الموقع + لوحات التحكم
    api/      # NestJS — backend
  packages/
    ui/       # الديزاين سيستم المشترك
    types/    # الأنواع المشتركة
    db/       # Prisma schema + migrations
    config/   # tailwind / tsconfig presets
```

## التشغيل

```bash
pnpm install
cp .env.example .env      # املا المتغيرات
pnpm db:generate
pnpm dev                  # يشغل web + api
```

## Railway
1. Project فيه PostgreSQL + Redis + خدمة API.
2. اربط GitHub → Railway للـ auto-deploy من branch main.
3. حط الـ secrets من .env.example.

سري. ملكية Ahmed. للاستخدام الداخلي فقط.
