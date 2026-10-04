const urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const namaBulan = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const state = {
  kunciKartu: null,
  timerPerubahan: null
};

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

// ---------- Jam realtime ----------

function renderJam() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  document.getElementById("jam-sekarang").textContent =
    `${namaHari[d.getDay()]}, ${d.getDate()} ${namaBulan[d.getMonth()]} · ${hh}:${mm}:${ss}`;
}

// ---------- Header ----------

function renderHeader() {
  document.getElementById("info-nama").textContent = mahasiswa.nama;
  document.getElementById("info-nim").textContent = mahasiswa.nim;
  document.getElementById("info-kelas").textContent = mahasiswa.kelas;
  document.getElementById("info-prodi").textContent = mahasiswa.prodi;
}

// ---------- Kuliah berikutnya ----------

function cariKuliahSekarang() {
  if (mataKuliah.length === 0) return null;

  const menit = menitSekarang();
  const mulai = urutanHari.indexOf(hariIni());
  if (mulai === -1) return null;

  for (let i = mulai; i < urutanHari.length; i++) {
    const hari = urutanHari[i];
    const daftarHariIni = mataKuliah.filter(mk => mk.hari === hari);
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
  const hasil = cariKuliahSekarang();
  const kunci = kunciKartu(hasil);

  if (kunci === state.kunciKartu) return;
  state.kunciKartu = kunci;

  if (!hasil) {
    container.innerHTML = `
      <div class="next-card next-kosong">
        Belum ada data mata kuliah.
      </div>
    `;
    return;
  }

  const { mk, status } = hasil;
  const label = labelKartu(status, mk.hari);
  const kelas = status === "berlangsung" ? "next-berlangsung" : "";
  const [jamMulai, jamSelesai] = mk.jam.split("-");

  container.innerHTML = `
    <div class="next-card ${kelas}">
      <div class="next-label">${label}</div>
      <div class="next-nama">${mk.nama}</div>
      <div class="next-detail">
        <span>${mk.hari}</span>
        <span class="meta-sep">·</span>
        <span>${jamMulai} – ${jamSelesai}</span>
        <span class="meta-sep">·</span>
        <span>Ruang ${mk.ruang}</span>
        <span class="meta-sep">·</span>
        <span>${mk.sks} SKS</span>
        <span class="meta-sep">·</span>
        <span>Kode dosen: ${mk.dosen}</span>
      </div>
    </div>
  `;
}

// ---------- Jadwal mingguan ----------

function renderJadwal() {
  const container = document.getElementById("daftar-hari");
  container.innerHTML = "";

  urutanHari.forEach(hari => {
    const daftar = mataKuliah.filter(mk => mk.hari === hari);
    if (daftar.length === 0) return;

    const div = document.createElement("div");
    div.className = "hari";
    div.dataset.hari = hari;

    const h3 = document.createElement("h3");
    h3.textContent = hari;
    div.appendChild(h3);

    daftar.forEach(mk => {
      const [jamMulai, jamSelesai] = mk.jam.split("-");

      const item = document.createElement("div");
      item.className = "mk";
      item.dataset.kode = mk.kode;
      item.dataset.jam = mk.jam;
      item.innerHTML = `
        <div class="mk-jam">
          ${jamMulai}
          <span class="mk-jam-selesai">– ${jamSelesai}</span>
        </div>
        <div class="mk-info">
          <div class="nama">${mk.nama}</div>
          <div class="detail">
            <span>${mk.ruang}</span>
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

// ---------- Inisialisasi ----------

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderJadwal();
  perbarui();
  renderJam();
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