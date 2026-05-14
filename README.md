# Roda Tiga Jakarta

Platform ride hailing bajaj listrik berbasis otomasi penuh.  
Stack: Next.js 14 · Supabase · Midtrans · OpenStreetMap · TypeScript · Tailwind

---

## Konteks Strategis — Baca Ini Dulu

Platform ini bukan sekadar aplikasi transportasi. Ia dirancang dari nol sebagai
**pure digital operation** — semua business logic berjalan di database dan algoritma,
bukan di tangan manusia.

**Core thesis:**
> Gojek dan Grab adalah perusahaan teknologi yang menjalankan operasi manual
> dalam skala besar. Itulah kelemahan fatal yang tidak bisa mereka perbaiki
> tanpa membongkar seluruh organisasi.

**Tiga keunggulan yang tidak bisa ditiru:**
1. Fee 10% (biaya operasional nyata hanya 2%) vs kompetitor 20–30%
2. Ekosistem motor listrik — biaya operasional driver turun paralel
3. Sistem berbasis keadilan dan kepercayaan — kultur yang tidak bisa dibeli

---

## Arsitektur — Satu Backbone, Tiga Antarmuka

```
App Penumpang  ──┐
App Pengemudi  ──┼──▶  Core Backbone (Supabase + Next.js API)
Dashboard Mgmt ──┘
```

Tidak ada silo. Semua algoritma berjalan di backbone yang sama.
Setiap fitur melibatkan minimal dua pihak.

---

## Struktur Direktori

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth session
│   │   ├── calculate-fare/         # Hitung fare berdasarkan jarak
│   │   ├── create-ride/            # Buat order baru
│   │   ├── create-payment/         # Inisiasi pembayaran Midtrans
│   │   ├── driver/
│   │   │   ├── accept-ride/        # Driver terima order
│   │   │   └── complete-ride/      # Driver selesaikan trip
│   │   └── webhook/midtrans/       # Callback pembayaran
│   ├── components/
│   │   ├── OSMMap.tsx              # Peta OpenStreetMap + live tracking
│   │   └── OrderStatusCard.tsx     # Status order + cancel engine + no-show
│   └── driver/
│       ├── page.tsx                # Entry driver app
│       ├── dashboard/              # DriverDashboard (TODO: belum ada component)
│       ├── earnings/               # Laporan pendapatan
│       └── charging/               # Booking stasiun charging
public/
├── audio/                          # new-order.mp3, tip-received.mp3
└── icons/                          # bajaj-icon.png, charging-station.png
```

---

## Database Schema (Supabase)

Schema lengkap ada di `roda_tiga_migration.sql`.
Migration sudah dijalankan — semua tabel aktif.

### Tabel yang sudah ada (dari awal)
| Tabel | Isi |
|---|---|
| `rides` | Inti operasional trip — diperluas dengan kolom scoring |
| `stations` | Stasiun charging bajaj listrik |
| `charging_bookings` | Booking slot charging |
| `fare_rules` | Konfigurasi tarif per zona jarak |

### Tabel baru (dari migration)
| Tabel | Fungsi |
|---|---|
| `users` | Semua user (passenger, driver, admin) dalam satu tabel |
| `passenger_profiles` | Skor reliabilitas, wallet, badge penumpang |
| `driver_profiles` | **Inti platform** — 5 komponen skor, tier, streak, wallet |
| `driver_documents` | Verifikasi KTP/SIM/STNK otomatis |
| `disputes` | Investigasi berbasis bukti, AI verdict |
| `score_events` | Audit trail setiap perubahan skor driver |
| `tier_history` | Riwayat naik/turun tier |
| `wallet_transactions` | Setiap rupiah tercatat dengan alasan |
| `workshops` | Mitra servis bajaj listrik |
| `workshop_bookings` | Booking servis dari aplikasi |
| `financing_contracts` | Cicilan motor listrik dipotong otomatis per trip |
| `financing_payments` | Riwayat setiap potongan cicilan |
| `platform_events` | Audit trail semua kejadian sistem |
| `notifications` | Pesan ke driver/penumpang |

### Views
| View | Fungsi |
|---|---|
| `view_earnings` | Ringkasan pendapatan per driver |
| `view_stations` | Stasiun + jumlah booking aktif |
| `view_platform_health` | Health dashboard manajemen real-time |

### Triggers Otomatis (zero manual ops)
1. `after_ride_completed` → update skor driver, recalculate tier, kirim notifikasi
2. `after_ride_status_change` → update reliability score penumpang
3. `after_ride_credit_earning` → kredit wallet driver, potong cicilan financing

---

## Sistem Scoring Driver

### 5 Komponen Skor (total 0–1000)
| Komponen | Bobot | Yang Diukur |
|---|---|---|
| Rating penumpang | 30% | Rata-rata rating 90 hari |
| Acceptance rate | 20% | % order diterima vs ditolak |
| Ketepatan pickup | 20% | % tiba dalam estimasi waktu |
| Tingkat pembatalan | 15% | % order dibatalkan driver |
| Keluhan valid | 15% | Keluhan terbukti valid setelah investigasi |

### Tier & Commission Rate
| Tier | Skor | Fee Dasar |
|---|---|---|
| Platinum | 900–1000 | 8% |
| Gold | 750–899 | 9% |
| Silver | 600–749 | 10% |
| Probation | < 600 | 10% + coaching |

### Reward System — Investasi Efisiensi, Bukan Diskon

Platform mengorbankan sebagian komisi untuk membeli efisiensi waktu tunggu.
Waktu tunggu lebih pendek → trip per jam naik → volume naik → revenue naik.
Ini bukan bagi margin — ini investasi operasional yang ROI-nya positif.

| Perilaku | Penerima | Bentuk | Nilai |
|---|---|---|---|
| Driver tiba ontime | Driver | Bonus cash ke wallet | 1% dari fare |
| Penumpang sudah siap, langsung naik | Penumpang | Cashback ke wallet | 2% dari fare |
| Keduanya sempurna | Keduanya | Bonus + cashback | 3% dari fare |
| Streak 10 trip sempurna | Driver | Badge Profesional | — |
| Streak 50 trip sempurna | Driver | Badge Excellent | — |

**Kenapa cashback, bukan diskon:**
- Diskon tidak terasa — tarif sudah lebih murah dari kompetitor
- Cashback terlihat nyata — saldo wallet bertambah, ada momen kepuasan
- Cashback mengunci penumpang di ekosistem — saldo hanya berlaku di platform ini
- Bonus wallet driver terlihat langsung di dashboard — reinforcement instan

**Matematika per trip Rp 20.000 (trip sempurna):**
- Platform ambil komisi 10% = Rp 2.000
- Bonus driver (1%) = Rp 200 keluar dari komisi
- Cashback penumpang (2%) = Rp 400 keluar dari komisi
- Platform bersih: Rp 1.400 — masih 5× di atas biaya operasional 2%

**Flywheel efisiensi:**
```
Driver ontime → cashback penumpang
      ↓
Penumpang siap → bonus driver
      ↓
Waktu tunggu turun → trip per jam naik +30–40%
      ↓
Volume trip naik → revenue platform naik
      ↓
Platform punya lebih banyak ruang untuk reward
```

**Biaya operasional platform: 2%. Komisi minimum: 2%. Selalu profitable.**

---

## Sistem Dispute

Prinsip: **keputusan berbasis bukti, bukan rasa tidak suka.**

1. Dispute masuk → sistem kirim pertanyaan ke kedua pihak secara paralel
2. Kumpulkan data objektif: GPS trace, waktu tunggu, riwayat historis
3. Bobot kredibilitas disesuaikan: driver 4.9 selama 6 bulan vs penumpang
   yang komplain 8 dari 10 trip — tidak diperlakukan sama
4. AI verdict dengan confidence score
5. Jika driver mengakui kesalahan → tidak dihukum, difasilitasi minta maaf
6. Edge case eskalasi ke manusia (field `escalated_to_human`)

---

## Cancel & No-Show Engine

### Penumpang
- Cancel < 5 menit → gratis
- Cancel 5–10 menit → debit 50% fare
- Cancel setelah driver tiba / > 10 menit → debit penuh
- No-show 30 menit setelah driver tiba → debit otomatis

### Logika ada di
- `OrderStatusCard.tsx` — sisi penumpang (timer, debit display)
- Tabel `rides` kolom `cancel_fee_charged`, `cancelled_by`, `arrived_at`
- Trigger `after_ride_status_change` — update passenger reliability score

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=

# Mapbox (opsional — OSM sudah jalan tanpa ini)
NEXT_PUBLIC_MAPBOX_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Status Pengembangan

### ✅ Selesai
- [x] Database schema lengkap + migration
- [x] Fare kalkulasi (calculate-fare API)
- [x] Create ride + accept ride + complete ride
- [x] Payment Midtrans (webhook handler)
- [x] OSMMap dengan live tracking simulasi
- [x] OrderStatusCard — cancel engine + no-show countdown
- [x] Driver earnings page
- [x] Charging station booking

### 🔨 Sedang / Berikutnya
- [x] **Database migration selesai** — 18 tabel, 25 FK, 4 views
  - [ ] **Auth &amp; session** — hubungkan Supabase Auth ke tabel `users`
  - `passenger_id` masih `'temp-user-id'` di `create-ride/route.ts`
- [ ] **DriverDashboard component** — dirujuk tapi belum ada
  - Path: `src/components/driver/DriverDashboard.tsx`
  - Isi: skor 5 komponen, tier, streak, reward per trip, notifikasi
- [ ] **Scoring engine** — API update skor setelah trip selesai
- [ ] **Dispute API** — endpoint investigasi + AI verdict
- [ ] **Passenger app** — UI pemesanan + tracking
- [ ] **Management dashboard** — `view_platform_health` + analytics
- [ ] **Financing module** — UI kontrak + riwayat cicilan
- [ ] **Workshop booking** — UI booking servis

### 📋 Backlog
- [ ] Push notification (driver dapat order baru)
- [ ] Heatmap demand Jakarta (analytics manajemen)
- [ ] Fraud detection otomatis
- [ ] Referral system
- [ ] Badge & loyalty penumpang

---

## Aturan Pengembangan

1. **Tidak ada business logic di frontend** — semua kalkulasi (fare, skor,
   commission) harus di API route atau database function
2. **Tidak ada `temp-user-id`** — setiap endpoint harus baca dari session
3. **Setiap perubahan skor tercatat di `score_events`** — tidak ada update
   skor langsung tanpa audit trail
4. **Triggers tidak digantikan manual** — biarkan database yang mengeksekusi
   scoring, wallet credit, dan financing deduction
5. **Dispute tidak pernah one-sided** — sistem selalu tanya kedua pihak
   sebelum verdict

---

## Filosofi Platform

> Platform ini tidak membangun aplikasi transportasi.
> Platform ini merancang sistem yang menggunakan insentif ekonomi
> sebagai alat untuk membentuk perilaku manusia menjadi lebih baik —
> secara otomatis, konsisten, dan dalam skala jutaan interaksi per hari.

Driver yang merasa diperlakukan adil tidak akan pindah platform.  
Penumpang yang merasa sistemnya jujur tidak akan pindah karena promo.  
Loyalitas berbasis martabat lebih kuat dari loyalitas berbasis diskon.

**Tentang reward system:** Platform tidak sedang membagi margin.
Platform sedang membeli efisiensi operasional — waktu tunggu lebih pendek,
frekuensi trip lebih tinggi, volume lebih besar. Nilai yang didapat jauh
melebihi 3% yang dikorbankan per trip sempurna.

Gojek dan Grab tidak bisa bermain di level ini karena overhead mereka
terlalu gemuk untuk merasakan dampak efisiensi mikro per trip.

---

## Catatan Migration

**Status: SELESAI — $(date '+%Y-%m-%d')**

Semua tabel aktif di Supabase:

| Kategori | Tabel |
|---|---|
| Core | `profiles` (=users), `rides` |
| Driver | `driver_profiles`, `driver_documents`, `tier_history`, `score_events` |
| Penumpang | `passenger_profiles` |
| Keuangan | `wallet_transactions`, `financing_contracts`, `financing_payments` |
| Operasional | `stations`, `charging_bookings`, `workshops`, `workshop_bookings` |
| Sistem | `disputes`, `notifications`, `platform_events`, `fare_rules` |
| Views | `users`, `view_earnings`, `view_stations`, `view_platform_health` |

**Catatan penting:**
- Tabel `profiles` adalah tabel users utama — bukan `users`
- `users` adalah VIEW yang menunjuk ke `profiles`
- `rides` kolom lama (`passenger_phone`, `driver_phone`) dipertahankan untuk backward compatibility
- `rides.passenger_id` dan `rides.driver_id` adalah UUID references ke `profiles(id)`
- `stations.id` bertipe integer (bukan UUID) — join ke `charging_bookings` pakai cast `::text`
- Semua business logic ada di database functions dan triggers — tidak di aplikasi
