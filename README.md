# Sales Dashboard Pro

Next.js 14 + Supabase tabanlı, tek tenant çalışan satış dashboard uygulaması.

## Özellikler
- Satış/Ürün yöneticileri CRUD (modal akışı, pasife alma)
- Hedef yönetimi + Excel template/import/export
- Fatura yönetimi + filtre + Excel export
- Genel dashboard (KPI + gelişmiş grafik seti)
- Kişisel dashboard (KPI + yönetici odaklı grafikler)
- Prim katsayısı, hesaplama ve prim kayıt/export
- Supabase'de kalıcı veri, localStorage yok
- Tema sistemi (mavi, yeşil, kırmızımsı, gradyen, gece, gündüz)

## Teknolojiler
- Next.js 14 App Router
- Tailwind CSS
- Supabase JS SDK
- TanStack Table
- Chart.js + react-chartjs-2
- SheetJS (xlsx)
- React Hook Form + Zod

## Kurulum
1. Bağımlılıkları kur:
```bash
npm install
```
2. `.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur.
3. Supabase migration çalıştır:
```bash
supabase db push
```
4. Local çalıştır:
```bash
npm run dev
```

## Supabase Migration
Migration dosyaları:
- `supabase/migrations/202604130001_init_sales_dashboard.sql`
- `supabase/migrations/202604130002_seed_demo.sql` (opsiyonel demo)

## Deploy

### Vercel
1. Repo'yu Vercel'e bağla
2. Env değişkenlerini ekle:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build komutu: `npm run build`

### Netlify
1. Repo'yu Netlify'e bağla
2. Build komutu: `npm run build`
3. Publish dizini: `.next`
4. Env değişkenlerini ekle:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Davranış Test Kontrol Listesi
1. Yeni fatura ekle -> Faturalar gridinde görünür.
2. Aynı yıl/ay filtreli Genel Dashboard gerçekleşmesi artar.
3. İlgili yönetici Kişisel Dashboard gerçekleşmesi artar.
4. Hedef Excel import sonrası başarı yüzdeleri güncellenir.
5. Ayarlar'dan tema değişince tüm sayfalara yansır.
6. Prim hesapla + kaydet + export çalışır.
