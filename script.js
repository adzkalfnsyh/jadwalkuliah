const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const namaBulan = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const state = {
  kunciKartu: null,
  timerPerubahan: null,
  timerRealtime: null,
  hasilSekarang: null
};

// ---------- Utilitas ----------

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

function pad(n) {
  return String(n).padStart(2, "0");
}

// Escape HTML untuk mencegah XSS jika data nanti dari sumber eksternal.
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape untuk nilai atribut href — hanya izinkan http(s).
function escapeHref(url) {
  if (!url) return "";
  const s = String(url).trim();
  if (!/^https?:\/\//i.test(s)) return "";
  return s.replace(/"/g, "%22");
}

// ---------- Tema ----------

function terapkanTema(tema) {
  document.documentElement.dataset.tema = tema;
  try {
    localStorage.setItem("tema", tema);
  } catch (e) {}
}

function inisialisasiTema() {
  const tombol = document.getElementById("theme-toggle");
  if (!tombol) return;
  tombol.addEventListener("click", () => {
    const sekarang = document.documentElement.dataset.tema;
    terapkanTema(sekarang === "gelap" ? "terang" : "gelap");
  });
}

// ---------- Jam realtime ----------

function renderJam() {
  const d = new Date();
  const el = document.getElementById("jam-sekarang");
  if (!el) return;
  el.textContent =
    `${namaHari[d.getDay()]}, ${d.getDate()} ${namaBulan[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---------- Header ----------

function renderHeader() {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
  };
  set("info-nama", mahasiswa.nama);
  set("info-nim", mahasiswa.nim);
  set("info-kelas", mahasiswa.kelas);
  set("info-prodi", mahasiswa.prodi);
  set("info-semester", semester.label);
}

// ---------- Hitungan mundur ----------

function targetWaktuKuliah(hasil) {
  if (!hasil) return null;

  const { mk, status } = hasil;
  const [jamMulai, jamSelesai] = mk.jam.split("-");
  const selisihHari = selisihHariKe(mk.hari);

  const sekarang = new Date();
  const target = new Date(sekarang);
  target.setSeconds(0, 0);
  target.setDate(sekarang.getDate() + selisihHari);

  if (status === "berlangsung") {
    const [h, m] = jamSelesai.split(":").map(Number);
    target.setHours(h, m, 0, 0);
    return target;
  }

  const [h, m] = jamMulai.split(":").map(Number);
  target.setHours(h, m, 0, 0);
  return target;
}

function formatDurasi(ms) {
  if (ms <= 0) return "sekarang";
  const totalDetik = Math.floor(ms / 1000);
  const hari = Math.floor(totalDetik / 86400);
  const jam = Math.floor((totalDetik % 86400) / 3600);
  const menit = Math.floor((totalDetik % 3600) / 60);
  const detik = totalDetik % 60;

  const bagian = [];
  if (hari > 0) bagian.push(`${hari} hari`);
  if (jam > 0 || hari > 0) bagian.push(`${jam} jam`);
  if (menit > 0 || jam > 0 || hari > 0) bagian.push(`${menit} menit`);
  bagian.push(`${detik} detik`);

  return bagian.join(" ");
}

// Update countdown di kartu yang sudah ada (dipanggil tiap detik).
function perbaruiHitungMundur() {
  const el = document.getElementById("hitung-mundur");
  if (!el) return;

  const hasil = state.hasilSekarang;
  const target = targetWaktuKuliah(hasil);
  if (!target) {
    el.textContent = "";
    return;
  }

  const sisa = target - new Date();

  if (hasil.status === "berlangsung") {
    el.textContent = `Berakhir dalam ${formatDurasi(sisa)}`;
  } else {
    el.textContent = `Mulai dalam ${formatDurasi(sisa)}`;
  }
}

// ---------- Kuliah berikutnya ----------

function cariKuliahSekarang() {
  if (mataKuliah.length === 0) return null;

  const menit = menitSekarang();
  const mulai = urutanHari.indexOf(hariIni());
  if (mulai === -1) return null;

  for (let i = mulai; i < urutanHari.length; i++) {
    const hari = urutanHari[i];
    const daftarHariIni = mataKuliah
      .filter(mk => mk.hari === hari)
      .sort((a, b) => jamKeMenit(a.jam.split("-")[0]) - jamKeMenit(b.jam.split("-")[0]));

    if (daftarHariIni.length === 0) continue;

    for (const mk of daftarHariIni) {
      const [jamMulai, jamSelesai] = mk.jam.split("-");
      const m1 = jamKeMenit(jamMulai);
      const m2 = jamKeMenit(jamSelesai);

      if (i === mulai) {
        if (menit >= m1 && menit < m2) {
          return { mk, status: "berlangsung" };
        }
        if (menit < m1) {
          return { mk, status: "akan-datang" };
        }
      } else {
        return { mk, status: "akan-datang" };
      }
    }
  }

  const pertamaMingguDepan = [...mataKuliah].sort((a, b) => {
    const selisihHari = urutanHari.indexOf(a.hari) - urutanHari.indexOf(b.hari);
    if (selisihHari !== 0) return selisihHari;
    return jamKeMenit(a.jam.split("-")[0]) - jamKeMenit(b.jam.split("-")[0]);
  })[0];

  return { mk: pertamaMingguDepan, status: "minggu-depan" };
}

function labelKartu(status, hariMk) {
  if (status === "berlangsung") return "Sedang berlangsung";
  if (status === "minggu-depan") return "Minggu depan";

  const selisih = selisihHariKe(hariMk);
  if (selisih === 0) return "Hari ini";
  if (selisih === 1) return "Besok";
  return hariMk;
}

function kunciKartu(hasil) {
  if (!hasil) return "kosong";
  return `${hasil.mk.kode}|${hasil.status}|${labelKartu(hasil.status, hasil.mk.hari)}`;
}

function renderKuliahBerikutnya() {
  const container = document.getElementById("kuliah-berikutnya");
  if (!container) return;

  const hasil = cariKuliahSekarang();
  const kunci = kunciKartu(hasil);

  // Simpan hasil terbaru agar countdown selalu sinkron walau kartu tidak di-render ulang.
  state.hasilSekarang = hasil;

  if (kunci !== state.kunciKartu) {
    state.kunciKartu = kunci;

    if (!hasil) {
      container.innerHTML = `
        <div class="next-card next-kosong">
          Belum ada data mata kuliah.
        </div>
      `;
    } else {
      const { mk, status } = hasil;
      const label = labelKartu(status, mk.hari);
      const kelas = status === "berlangsung" ? "next-berlangsung" : "";
      const [jamMulai, jamSelesai] = mk.jam.split("-");
      const href = escapeHref(mk.materi);

      container.innerHTML = `
        <div class="next-card ${kelas}">
          <div class="next-label">${escapeHtml(label)}</div>
          <div class="next-nama">${escapeHtml(mk.nama)}</div>
          <div class="next-detail">
            <span>${escapeHtml(mk.hari)}</span>
            <span class="meta-sep">·</span>
            <span>${escapeHtml(jamMulai)} – ${escapeHtml(jamSelesai)}</span>
            <span class="meta-sep">·</span>
            <span>Ruang ${escapeHtml(mk.ruang)}</span>
            <span class="meta-sep">·</span>
            <span>${escapeHtml(mk.sks)} SKS</span>
            <span class="meta-sep">·</span>
            <span>Kode dosen: ${escapeHtml(mk.dosen)}</span>
          </div>
          <div class="next-action">
            ${href
              ? `<a class="btn" href="${href}" target="_blank" rel="noopener">Buka materi</a>`
              : `<span class="btn disabled">Belum ada</span>`}
          </div>
          <div class="next-countdown" id="hitung-mundur"></div>
        </div>
      `;
    }
  }

  perbaruiHitungMundur();
}

// ---------- Jadwal mingguan ----------

function ringkasanHari(daftar) {
  const jumlahMk = daftar.length;
  const jumlahSks = daftar.reduce((total, mk) => total + (mk.sks || 0), 0);
  return `${jumlahMk} MK · ${jumlahSks} SKS`;
}

function renderJadwal() {
  const container = document.getElementById("daftar-hari");
  if (!container) return;
  container.innerHTML = "";

  urutanHari.forEach(hari => {
    const daftar = mataKuliah
      .filter(mk => mk.hari === hari)
      .sort((a, b) => jamKeMenit(a.jam.split("-")[0]) - jamKeMenit(b.jam.split("-")[0]));

    if (daftar.length === 0) return;

    const div = document.createElement("div");
    div.className = "hari";
    div.dataset.hari = hari;

    const h3 = document.createElement("h3");
    h3.textContent = hari;
    div.appendChild(h3);

    const ringkas = document.createElement("span");
    ringkas.className = "hari-ringkas";
    ringkas.textContent = ringkasanHari(daftar);
    h3.appendChild(ringkas);

    daftar.forEach(mk => {
      const [jamMulai, jamSelesai] = mk.jam.split("-");

      const item = document.createElement("div");
      item.className = "mk";
      item.dataset.kode = mk.kode;
      item.dataset.jam = mk.jam;

      const detail = [];
      detail.push(`<span>${escapeHtml(mk.ruang)}</span>`);
      if (mk.online) {
        detail.push(`<span class="badge-online">MK Online</span>`);
      }
      detail.push(`<span class="meta-sep">·</span>`);
      detail.push(`<span>Kode dosen: ${escapeHtml(mk.dosen)}</span>`);
      detail.push(`<span class="meta-sep">·</span>`);
      detail.push(`<span>${escapeHtml(mk.sks)} SKS</span>`);

      const href = escapeHref(mk.materi);

      item.innerHTML = `
        <div class="mk-jam">
          ${escapeHtml(jamMulai)}
          <span class="mk-jam-selesai">– ${escapeHtml(jamSelesai)}</span>
        </div>
        <div class="mk-info">
          <div class="nama">${escapeHtml(mk.nama)}</div>
          <div class="detail">${detail.join(" ")}</div>
        </div>
        <div class="mk-action">
          ${href
            ? `<a class="btn" href="${href}" target="_blank" rel="noopener">Buka materi</a>`
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

function perbarui() {
  renderKuliahBerikutnya();
  perbaruiHighlight();
  perbaruiStatusBaris();
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
  return totalDetik * 1000 + 200;
}

function jadwalkanPerubahanBerikutnya() {
  if (state.timerPerubahan) clearTimeout(state.timerPerubahan);
  const delay = milidetikKePerubahanBerikutnya();
  state.timerPerubahan = setTimeout(() => {
    perbarui();
    jadwalkanPerubahanBerikutnya();
  }, delay);
}

// ---------- Loop realtime (digabung: jam + countdown) ----------

function tickRealtime() {
  renderJam();
  perbaruiHitungMundur();
}

function mulaiLoopRealtime() {
  if (state.timerRealtime) clearInterval(state.timerRealtime);
  tickRealtime();
  state.timerRealtime = setInterval(tickRealtime, 1000);
}

function hentikanLoopRealtime() {
  if (state.timerRealtime) {
    clearInterval(state.timerRealtime);
    state.timerRealtime = null;
  }
  if (state.timerPerubahan) {
    clearTimeout(state.timerPerubahan);
    state.timerPerubahan = null;
  }
}

// ---------- Inisialisasi ----------

document.addEventListener("DOMContentLoaded", () => {
  inisialisasiTema();
  renderHeader();
  renderJadwal();
  perbarui();
  mulaiLoopRealtime();
  jadwalkanPerubahanBerikutnya();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hentikanLoopRealtime();
  } else {
    perbarui();
    mulaiLoopRealtime();
    jadwalkanPerubahanBerikutnya();
  }
});

window.addEventListener("pagehide", hentikanLoopRealtime);