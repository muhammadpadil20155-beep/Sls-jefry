# SLS Divisi 2 - Website + Bot WhatsApp (Vercel)

## Deploy
1. Upload folder ini ke GitHub, lalu Import di Vercel (atau `vercel --prod`).
2. Di Vercel: Storage / Marketplace, tambah **Upstash Redis** dan hubungkan ke project (env otomatis terisi).
3. Vercel, Settings, Environment Variables, isi:
   - `FONNTE_TOKEN` : token device dari fonnte.com
   - `OWNER_CODE`   : sama dengan kode owner di panel owner (default SLSOWNER2)
   - `ADMIN_WA`     : nomor admin, format 628xxxxxxxxxx
   - `SITE_URL`     : alamat website Vercel kamu
   - `CRON_SECRET`  : teks acak (opsional, mengamankan pengingat harian)
4. Redeploy.
5. Di dashboard Fonnte: isi Webhook URL = `https://DOMAIN-KAMU/api/webhook` (matikan fitur autoreply Fonnte, karena tidak jalan bersamaan dengan webhook).

## Yang otomatis jalan
- Pendaftar baru: dapat pesan konfirmasi, admin dapat notifikasi.
- Owner ACC tim: semua anggota tim dapat pesan.
- Pengingat jadwal: tiap pagi 08.00 WIB ke pemain yang timnya main hari ini/besok.
- Bot membalas: .menu (dengan gambar public/menu.png), .info, .tim, .jadwal, .klasemen, .top, .status, .daftar. Ganti gambar menu dengan menimpa public/menu.png (SITE_URL wajib diisi).
