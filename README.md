# Jadwal Kuliah Adzka

Website jadwal kuliah pribadi untuk **Semester Ganjil 2026/2027** — dibuat dengan HTML, CSS, dan JavaScript murni. Tanpa framework, tanpa dependencies, tanpa backend.

🔗 **Live:** [adzkalfnsyh.github.io/jadwalkuliah](https://adzkalfnsyh.github.io/jadwalkuliah/)

---

## ✨ Fitur

- 📅 **Jadwal mingguan** dengan tampilan rapi per hari
- ⏱️ **Countdown real-time** ke kuliah berikutnya
- 🟢 **Status "berlangsung"** dengan sisa waktu tiap detik
- 🔍 **Filter "Hari ini"** untuk fokus jadwal hari ini
- 🌓 **Dark mode otomatis** mengikuti preferensi sistem
- 🔔 **Notifikasi browser** 10 menit sebelum kuliah
- 📡 **PWA + offline** — bisa di-install & dibuka tanpa internet
- 🔒 **Aman** — escape HTML, tidak ada tracking, tidak ada cookie

---

## 📱 Cara Pakai

### Sebagai website
Buka langsung: [adzkalfnsyh.github.io/jadwalkuliah](https://adzkalfnsyh.github.io/jadwalkuliah/)

### Install ke HP (Android)
1. Buka URL di **Chrome**
2. Menu **⋮** → **"Install app"** atau **"Add to Home screen"**
3. Ikon muncul di home screen → buka seperti app native

### Install ke HP (iOS)
1. Buka URL di **Safari**
2. Tombol **Share** → **"Add to Home Screen"**

### Install ke Desktop (Chrome/Edge)
- Klik ikon **⊕** di address bar, atau
- Menu browser → **"Install app"** / **"Install this site as an app"**

---

## 🛠️ Cara Update Jadwal

Semua data jadwal ada di **`data.js`**. Buka file itu, edit bagian yang perlu:

### Ubah info mahasiswa
```js
const mahasiswa = {
  nama: "Nama Anda",
  nim: "NIM Anda",
  kelas: "Kelas Anda",
  prodi: "Prodi Anda"
};
