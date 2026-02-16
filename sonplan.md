# Son Plan — FHEVM Bootcamp Final Polish

**Deadline:** March 15, 2026 | **Bounty:** $5,000 (1st: $2,500 / 2nd: $1,500 / 3rd: $1,000)

---

## A. Bug Fixes (Diğer Terminal'den — Doğrulandı)

### A.1 — COMMON_PITFALLS.md: div() scalar-only hatası
- **Dosya:** `resources/COMMON_PITFALLS.md:465`
- **Sorun:** `FHE.div(amount, FHE.asEuint64(100))` — "Correct" bölümünde gösteriliyor ama `FHE.div` ikinci parametresi SADECE scalar olabilir, encrypted parametre çalışmaz
- **Fix:** `FHE.div(amount, 100)` olarak düzelt

### A.2 — CHEATSHEET.md: div/rem scalar uyarısı eksik
- **Dosya:** `resources/CHEATSHEET.md:130-131`
- **Sorun:** `FHE.div(a, b)` / `FHE.rem(a, b)` — b'nin encrypted gibi gösterilmesi yanıltıcı, scalar olması gerektiği belirtilmemiş
- **Fix:** Tabloda `b` yerine `plaintext` yaz, dipnot ekle

### A.3 — Module 15 lesson: randomEuintXX → randEuintXX
- **Dosya:** `modules/15-gas-optimization/lesson.md:46`
- **Sorun:** `FHE.randomEuintXX` yanlış, doğrusu `FHE.randEuintXX`
- **Fix:** `randomEuintXX` → `randEuintXX`

### B.2 — TODO_REPORT.md güncel değil
- **Dosya:** `TODO_REPORT.md`
- **Sorun:** "25 kontrat, 216 test, 15 modül" — gerçek: 35 kontrat, 328 test, 20 modül
- **Fix:** Tüm dosyayı güncelle

### B.3 — Module 11 README level tutarsızlığı
- **Dosya:** `modules/11-project-erc20/README.md:7`
- **Sorun:** "Intermediate" yazıyor, SYLLABUS "Advanced" diyor
- **Fix:** "Advanced" olarak düzelt (SYLLABUS doğru)

### B.4 — setup.sh Node 18+ kontrol, README 20+ gerektiriyor
- **Dosya:** `scripts/setup.sh:15,19,20`
- **Sorun:** Node 18+ kontrol ediyor ama README 20+ gerektiriyor
- **Fix:** setup.sh'de 18 → 20 olarak değiştir

### C.1 — COMMON_PITFALLS.md: proof parametre adı tutarsızlığı
- **Dosya:** `resources/COMMON_PITFALLS.md` (22 yerde)
- **Sorun:** `bytes calldata proof` kullanıyor, kontratlar `inputProof` kullanıyor
- **Fix:** Tüm `proof` → `inputProof` olarak değiştir (kontratlarla tutarlı)

### C.2 — GAS_GUIDE.md: div/rem scalar-only uyarısı eksik
- **Dosya:** `resources/GAS_GUIDE.md:29-30`
- **Sorun:** div/rem gas tablosunda scalar-only olduğu belirtilmemiş
- **Fix:** Tabloya "(scalar only)" notu ekle

---

## B. Eksik Slide'lar (6 modül)

### B.S1 — Module 14: Testing & Debugging slides
### B.S2 — Module 15: Gas Optimization slides
### B.S3 — Module 16: Security Best Practices slides
### B.S4 — Module 17: Advanced FHE Patterns slides
### B.S5 — Module 18: Confidential DeFi slides
### B.S6 — Module 19: Capstone DAO slides

Her biri Marp formatında, diğer modüllerle tutarlı stil.

---

## C. Yeni Dosyalar

### C.1 — QUICK_START.md
- Jüri için 10 dakikada çalıştırma rehberi
- Prerequisites, clone, install, test, deploy komutları
- Tek komutla çalışan flow

### C.2 — Dockerfile + docker-compose.yml
- `docker run` ile tek komutla tüm testleri çalıştır
- Reproducibility için önemli

### C.3 — İnteraktif Quiz Sistemi
- Basit web tabanlı quiz (React veya vanilla JS)
- Her modül için quiz sayfası
- Doğru/yanlış feedback, skor gösterimi

---

## D. Güçlü Tavsiyeler

### D.1 — ONCHAIN_TESTS.md API referansları düzelt
- `FHE.asEuint8` → context'e göre `FHE.fromExternal()` düzelt

### D.2 — Module 10 frontend karışıklığı çöz
- modules/10-frontend-integration/frontend/ mockup'ı kaldır veya gerçek dApp'e yönlendir

### D.3 — Etherscan source verify (35 kontrat)
- Tüm kontratların source code'unu Etherscan'de verify et

### D.4 — Frontend'i Vercel'e deploy et
- Canlı demo link sağla

### D.5 — Video demo script yaz (90 saniye)
- Deploy → execute → reveal akışını gösteren senaryo

---

## E. Sıralama

1. Bug fixes (A.1-C.2) — ~1 saat
2. Slide'lar (B.S1-B.S6) — ~2-3 saat
3. QUICK_START.md — ~30 dk
4. Dockerfile — ~30 dk
5. İnteraktif Quiz — ~2-3 saat
6. TODO_REPORT güncelleme — ~10 dk
7. ONCHAIN_TESTS + Module 10 fix — ~30 dk
8. Video demo script — ~30 dk
9. Etherscan verify — ~1 saat
10. Vercel deploy — ~30 dk

**Toplam tahmini:** ~8-10 saat iş
