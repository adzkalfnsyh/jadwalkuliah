const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const namaBulan = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const state = {
  kunciKartu: null,
  timerPerubahan: null,
  kuliahAktif: null
};

// ---------- Validasi data ----------

function validasiData() {
  const masalah = [];

  if (!Array.isArray(mataKuliah)) {
    masalah.push("mataKuliah bukan array.");
    return masalah;
  }

  mataKuliah.forEach((mk, i) => {
    const label = `mataKuliah[${i}] (${mk && mk.nama ? mk.nama : "tanpa nama"})`;

    if (!mk || typeof mk !== "object") {
      masalah.push(`${label}: bukan objek.`);
      return;
    }
    if (!mk.kode || typeof mk.kode !== "string") {
      masalah.push(`${label}: field "kode" wajib string.`);
    }
    if (!mk.nama || typeof mk.nama !== "string") {
      masalah.push(`${label}: field "nama" wajib string.`);
    }
    if (!urutanHari.includes(mk.hari)) {
      masalah.push(`${label}: hari "${mk.hari}" tidak dikenal.`);
    }
    if (typeof mk.jam !== "string" || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(mk.jam)) {
      masalah.push(`${label}: jam "${mk.jam}" tidak sesuai format HH:MM-HH:MM.`);
      return;
    }
    const [mulai, selesai] = mk.jam.split("-");
    if (jamKeMenit(selesai) <= jamKeMenit(mulai)) {
      masalah.push(`${label}: jam selesai harus lebih besar dari jam mulai.`);
    }
  });

  return masalah;
}

function tampilkanMasalahData(masalah) {
  if (masalah.length === 0) return;
  console.warn("Ditemukan masalah pada data mata kuliah:");
  masalah.forEach(m => console.warn(" - " + m));
}

// ---------- Utilitas waktu ----------

function jamKeMenit(jam) {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + m;
}

function hariIni() {
  return namaHari[new Date().getDay()];
}

function menitSekarang() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function selisihHariKe(hariTarget) {
  const iSekarang = urutanHari.indexOf(hariIni());
  const iTarget = urutanHari.indexOf(hariTarget);
  return (iTarget - iSekarang + 7) % 7;
}

function selisihDetikKe(hariDepan, jamStr) {
  const [h, m] = jamStr.split(":").map(Number);
  const target = new Date();
  target.setDate(target.getDate() + hariDepan);
  target.setHours(h, m, 0, 0);
  return Math.round((target - new Date()) / 1000);
}

function formatDurasi(totalDetik) {
  if (totalDetik <= 0) return "sekarang";

  const hari = Math.floor(totalDetik / 86400);
  const jam = Math.floor((totalDetik % 86400) / 3600);
  const menit = Math.floor((totalDetik % 3600) / 60);
  const detik = totalDetik % 60;

  const bagian = [];

  if (hari > 0) bagian.push(`${hari} hari`);
  if (jam > 0) bagian.push(`${jam} jam`);
  if (menit > 0) bagian.push(`${menit} menit`);
  if (detik > 0 || bagian.length === 0) bagian.push(`${detik} detik`);

  return bagian.join(" ");
}

// ---------- Utilitas tampilan ----------

function ruangHTML(mk) {
  if (mk.online) {
    return `<span class="badge-online">Online</span>`;
  }
  return `<span>Ruang ${mk.ruang}</span>`;
}

function ringkasanHari(daftar) {
  const totalSks = daftar.reduce((sum, mk) => sum + (mk.sks || 0), 0);
  return `${daftar.length} MK · ${totalSks} SKS`;
}

// ---------- Tema ----------

function terapkanTema(tema) {
  if (tema === "gelap" || tema === "terang") {
    document.documentElement.dataset.tema = tema;
  } else {
    delete document.documentElement.dataset.tema;
  }
  perbaruiIkonTema();
}

function temaEfektifGelap() {
  const tema = document.documentElement.dataset.tema;
  if (tema === "gelap") return true;
  if (tema === "terang") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function perbaruiIkonTema() {
  const tombol = document.getElementById("theme-toggle");
  if (!tombol) return;
  tombol.classList.toggle("tema-gelap", temaEfektifGelap());
}

function inisialisasiTema() {
  const tombol = document.getElementById("theme-toggle");
  if (!tombol) return;

  tombol.addEventListener("click", () => {
    const temaSekarang = temaEfektifGelap() ? "gelap" : "terang";
    const temaBaru = temaSekarang === "gelap" ? "terang" : "gelap";
    try {
      localStorage.setItem("tema", temaBaru);
    } catch (e) {}
    terapkanTema(temaBaru);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.dataset.tema) perbaruiIkonTema();
  });

  perbaruiIkonTema();
}

// ---------- Jam realtime ----------

function renderJam() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  document.getElementById("jam-sekarang").textContent =
    `${namaHari[d.getDay()]}, ${d.getDate()} ${namaBulan[d.getMonth()]} · ${hh}:${mm}:${ss}`;

  renderHitungMundur();
  perbaruiProgressBar();
}

// ---------- Header ----------

function renderHeader() {
  document.getElementById("info-nama").textContent = mahasiswa.nama;
  document.getElementById("info-nim").textContent = mahasiswa.nim;
  document.getElementById("info-kelas").textContent = mahasiswa.kelas;
  document.getElementById("info-prodi").textContent = mahasiswa.prodi;

  const elSemester = document.getElementById("info-semester");
  if (elSemester && typeof semester !== "undefined" && semester.label) {
    elSemester.textContent = semester.label;
  }
}

// ---------- Kuliah berikutnya ----------

function cariKuliahSekarang() {
  if (mataKuliah.length === 0) return null;

  const menit = menitSekarang();
  if (urutanHari.indexOf(hariIni()) === -1) return null;

  const kandidat = mataKuliah
    .map(mk => {
      const selisih = selisihHariKe(mk.hari);
      const [jamMulai, jamSelesai] = mk.jam.split("-");
      return {
        mk,
        selisih,
        mulai: jamKeMenit(jamMulai),
        selesai: jamKeMenit(jamSelesai)
      };
    })
    .sort((a, b) => {
      if (a.selisih !== b.selisih) return a.selisih - b.selisih;
      return a.mulai - b.mulai;
    });

  for (const k of kandidat) {
    if (k.selisih === 0) {
      if (menit >= k.mulai && menit < k.selesai) {
        return { mk: k.mk, status: "berlangsung", selisihHari: 0 };
      }
      if (menit < k.mulai) {
        return { mk: k.mk, status: "akan-datang", selisihHari: 0 };
      }
      continue;
    }
    return { mk: k.mk, status: "akan-datang", selisihHari: k.selisih };
  }

  const pertamaMingguDepan = kandidat[0];
  if (!pertamaMingguDepan) return null;
  return { mk: pertamaMingguDepan.mk, status: "minggu-depan", selisihHari: pertamaMingguDepan.selisih };
}

function labelKartu(status, hariMk) {
  if (status === "berlangsung") return "Sedang berlangsung";
  if (status === "minggu-depan") return `${hariMk} (minggu depan)`;

  const selisih = selisihHariKe(hariMk);
  if (selisih === 0) return "Hari ini";
  if (selisih === 1) return "Besok";
  return hariMk;
}

function judulSection(hasil) {
  if (!hasil) return "Kuliah berikutnya";
  if (hasil.status === "berlangsung") return "Sedang berlangsung";
  if (hasil.status === "minggu-depan") return "Kuliah minggu depan";
  return "Kuliah berikutnya";
}

function kunciKartu(hasil) {
  if (!hasil) return "kosong";
  return `${hasil.mk.kode}|${hasil.status}|${labelKartu(hasil.status, hasil.mk.hari)}`;
}

function hitungMundurUntuk(hasil) {
  if (!hasil) return "";

  const { mk, status, selisihHari } = hasil;
  const [jamMulai, jamSelesai] = mk.jam.split("-");

  if (status === "berlangsung") {
    const sisa = selisihDetikKe(0, jamSelesai);
    return `Berakhir dalam ${formatDurasi(sisa)}`;
  }

  const sisa = selisihDetikKe(selisihHari, jamMulai);
  return `Mulai dalam ${formatDurasi(sisa)}`;
}

function renderKuliahBerikutnya() {
  const container = document.getElementById("kuliah-berikutnya");
  const judulEl = document.getElementById("judul-kuliah");
  const hasil = cariKuliahSekarang();
  const kunci = kunciKartu(hasil);

  if (kunci === state.kunciKartu) return;
  state.kunciKartu = kunci;

  if (judulEl) {
    judulEl.textContent = judulSection(hasil);
  }

  if (!hasil) {
    state.kuliahAktif = null;
    container.innerHTML = `
      <div class="next-card next-kosong">
        Belum ada data mata kuliah.
      </div>
    `;
    return;
  }

  state.kuliahAktif = hasil;

  const { mk, status } = hasil;
  const label = labelKartu(status, mk.hari);
  const kelas = status === "berlangsung" ? "next-berlangsung" : "";
  const [jamMulai, jamSelesai] = mk.jam.split("-");
  const progressHTML = status === "berlangsung"
    ? `<div class="progress"><div class="progress-fill" id="progress-fill"></div></div>`
    : "";

  container.innerHTML = `
    <div class="next-card ${kelas}">
      <div class="next-label">${label}</div>
      <div class="next-nama">${mk.nama}</div>
      <div class="next-detail">
        <span>${mk.hari}</span>
        <span class="meta-sep">·</span>
        <span>${jamMulai} – ${jamSelesai}</span>
        <span class="meta-sep">·</span>
        ${ruangHTML(mk)}
        <span class="meta-sep">·</span>
        <span>${mk.sks} SKS</span>
        <span class="meta-sep">·</span>
        <span>Kode dosen: ${mk.dosen}</span>
      </div>
      <div class="next-countdown" id="hitung-mundur"></div>
      ${progressHTML}
    </div>
  `;

  renderHitungMundur();
  perbaruiProgressBar();
}

function renderHitungMundur() {
  const el = document.getElementById("hitung-mundur");
  if (!el || !state.kuliahAktif) return;
  el.textContent = hitungMundurUntuk(state.kuliahAktif);
}

function perbaruiProgressBar() {
  const fill = document.getElementById("progress-fill");
  if (!fill || !state.kuliahAktif) return;
  if (state.kuliahAktif.status !== "berlangsung") return;

  const { mk } = state.kuliahAktif;
  const [jamMulai, jamSelesai] = mk.jam.split("-");
  const m1 = jamKeMenit(jamMulai);
  const m2 = jamKeMenit(jamSelesai);
  const sekarang = menitSekarang();
  const persen = Math.max(0, Math.min(100, ((sekarang - m1) / (m2 - m1)) * 100));

  fill.style.width = persen.toFixed(2) + "%";
}

// ---------- Jadwal mingguan ----------

function mkBerikutnyaKode() {
  const hasil = cariKuliahSekarang();
  if (!hasil) return null;
  if (hasil.status === "berlangsung") return hasil.mk.kode;
  if (hasil.selisihHari === 0) return hasil.mk.kode;
  return null;
}

function renderJadwal() {
  const container = document.getElementById("daftar-hari");
  container.innerHTML = "";

  const kodeBerikutnya = mkBerikutnyaKode();

  urutanHari.forEach(hari => {
    const daftar = mataKuliah.filter(mk => mk.hari === hari);
    if (daftar.length === 0) return;

    const div = document.createElement("div");
    div.className = "hari";
    div.dataset.hari = hari;

    const header = document.createElement("div");
    header.className = "hari-header";

    const h3 = document.createElement("h3");
    h3.textContent = hari;
    header.appendChild(h3);

    const ringkasan = document.createElement("span");
    ringkasan.className = "hari-ringkasan";
    ringkasan.textContent = ringkasanHari(daftar);
    header.appendChild(ringkasan);

    div.appendChild(header);

    daftar.forEach(mk => {
      const [jamMulai, jamSelesai] = mk.jam.split("-");

      const item = document.createElement("div");
      item.className = "mk";
      item.dataset.kode = mk.kode;
      item.dataset.jam = mk.jam;
      if (mk.kode === kodeBerikutnya) item.classList.add("mk-berikutnya");

      item.innerHTML = `
        <div class="mk-jam">
          ${jamMulai}
          <span class="mk-jam-selesai">– ${jamSelesai}</span>
        </div>
        <div class="mk-info">
          <div class="nama">${mk.nama}</div>
          <div class="detail">
            ${ruangHTML(mk)}
            <span class="meta-sep">·</span>
            <span>Kode dosen: ${mk.dosen}</span>
            <span class="meta-sep">·</span>
            <span>${mk.sks} SKS</span>
          </div>
        </div>
        <div class="mk-action">
          ${mk.materi
            ? `<a class="btn" href="${mk.materi}" target="_blank" rel="noopener">Buka materi</a>`
            : `<span class="btn disabled">Belum ada</span>`}
        </div>
      `;
      div.appendChild(item);
    });

    container.appendChild(div);
  });
}

// ---------- Pembaruan realtime ----------

function perbaruiStatusBaris() {
  const hariSekarang = hariIni();
  const menit = menitSekarang();

  document.querySelectorAll(".hari").forEach(blokHari => {
    const hariBlok = blokHari.dataset.hari;
    const hariIniBlok = hariBlok === hariSekarang;

    blokHari.querySelectorAll(".mk").forEach(baris => {
      const [jamMulai, jamSelesai] = baris.dataset.jam.split("-");
      const m1 = jamKeMenit(jamMulai);
      const m2 = jamKeMenit(jamSelesai);

      const sedangBerlangsung = hariIniBlok && menit >= m1 && menit < m2;
      const sudahLewat = hariIniBlok && menit >= m2;
      const statusBaru = `${sedangBerlangsung}|${sudahLewat}`;

      if (baris.dataset.status === statusBaru) return;
      baris.dataset.status = statusBaru;

      baris.classList.toggle("mk-berlangsung", sedangBerlangsung);
      baris.classList.toggle("mk-lewat", sudahLewat);
    });
  });
}

function perbaruiHighlight() {
  const sekarang = hariIni();
  document.querySelectorAll(".hari").forEach(el => {
    el.classList.toggle("hari-ini", el.dataset.hari === sekarang);
  });
}

function perbaruiPenandaBerikutnya() {
  const kodeBerikutnya = mkBerikutnyaKode();
  document.querySelectorAll(".mk").forEach(baris => {
    baris.classList.toggle("mk-berikutnya", baris.dataset.kode === kodeBerikutnya);
  });
}

function perbarui() {
  renderKuliahBerikutnya();
  perbaruiHighlight();
  perbaruiStatusBaris();
  perbaruiPenandaBerikutnya();
}

// ---------- Penjadwalan tepat waktu ----------

function milidetikKePerubahanBerikutnya() {
  const d = new Date();
  const detikSekarang = d.getSeconds() + d.getMilliseconds() / 1000;
  const sisaDetikKeMenitBerikutnya = 60 - detikSekarang;

  const menit = menitSekarang();

  const titik = [];
  for (const mk of mataKuliah) {
    const [jm, js] = mk.jam.split("-");
    titik.push(jamKeMenit(jm));
    titik.push(jamKeMenit(js));
  }

  let selisihMenit = null;
  for (const t of titik) {
    if (t > menit) {
      const delta = t - menit;
      if (selisihMenit === null || delta < selisihMenit) selisihMenit = delta;
    }
  }

  const menitKeTengahMalam = 24 * 60 - menit;
  if (selisihMenit === null || selisihMenit > menitKeTengahMalam) {
    selisihMenit = menitKeTengahMalam;
  }

  const totalDetik = sisaDetikKeMenitBerikutnya + (selisihMenit - 1) * 60;
  return Math.max(totalDetik, 1) * 1000 + 200;
}

function jadwalkanPerubahanBerikutnya() {
  if (state.timerPerubahan) clearTimeout(state.timerPerubahan);
  const delay = milidetikKePerubahanBerikutnya();
  state.timerPerubahan = setTimeout(() => {
    perbarui();
    jadwalkanPerubahanBerikutnya();
  }, delay);
}

// ---------- Inisialisasi ----------

document.addEventListener("DOMContentLoaded", () => {
  tampilkanMasalahData(validasiData());
  renderHeader();
  renderJadwal();
  perbarui();
  renderJam();
  inisialisasiTema();
  jadwalkanPerubahanBerikutnya();
  setInterval(renderJam, 1000);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    perbarui();
    renderJam();
    jadwalkanPerubahanBerikutnya();
  }
});