$(function () {
  const $utama = $("#checklist > .checklist input[type='checkbox']");
  const $semua = $(".check-row input[type='checkbox']");
  const hariIni = new Date().toISOString().slice(0, 10);

  // ---- Simpan & muat status centang ----
  function simpan() {
    const status = $semua.map(function () { return this.checked; }).get();
    localStorage.setItem("ibadah-" + hariIni, JSON.stringify(status));
  }
  function muat() {
    const data = JSON.parse(localStorage.getItem("ibadah-" + hariIni) || "[]");
    $semua.each(function (i) { this.checked = !!data[i]; });
  }

  // ---- Update tampilan ----
  function update() {
    const total = $utama.length;
    const selesai = $utama.filter(":checked").length;

    $("#progress-text").text(selesai + " / " + total + " selesai");
    $("#progress-bar").animate({ width: (selesai / total * 100) + "%" }, 300);

    let pesan = "Mulai dari satu ibadah.";
    if (selesai === total) pesan = "MasyaAllah! Semua ibadah hari ini selesai.";
    else if (selesai > 0) pesan = "Alhamdulillah, " + selesai + " ibadah telah selesai.";
    $("#progress-caption").fadeOut(150, function () {
      $(this).text(pesan).fadeIn(150);
    });

    // label Belum / Sudah
    $semua.each(function () {
      $(this).siblings("small").text(this.checked ? "Sudah" : "Belum");
    });

    hitungStreak(selesai === total);
  }

  // ---- Streak ----
  function hitungStreak(lengkap) {
    let streak = parseInt(localStorage.getItem("streak") || "0");
    const terakhir = localStorage.getItem("streak-terakhir");

    if (lengkap && terakhir !== hariIni) {
      const kemarin = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      streak = (terakhir === kemarin) ? streak + 1 : 1;
      localStorage.setItem("streak", streak);
      localStorage.setItem("streak-terakhir", hariIni);
    }
    $("#streak-count").text(streak);
    $("#streak-message").text(
      streak === 0 ? "Mulai konsisten beribadah hari ini!"
                   : "Barakallah, pertahankan konsistensimu!"
    );
  }

  // ---- Mode Ramadhan on/off ----
  $("#toggle-ramadhan").on("click", function () {
    $("#ramadhan .ramadhan-list").slideToggle(300);
  });

  // ---- Smooth scroll ----
  $("a.button[href^='#']").on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: $($(this).attr("href")).offset().top - 20 }, 500);
  });

  // ---- Event centang ----
  $semua.on("change", function () { simpan(); update(); });

  muat();
  update();
});

// ---- Notifikasi ----
function aktifkanNotifikasi() {
  if (!("Notification" in window)) {
    $("#notification-status").text("Browser tidak mendukung notifikasi.");
    return;
  }
  Notification.requestPermission().then(function (izin) {
    if (izin === "granted") {
      $("#notification-status").text("Notifikasi aktif.");
      new Notification("Catatan Ibadah", { body: "Pengingat ibadah sudah aktif!" });
    } else {
      $("#notification-status").text("Izin notifikasi ditolak.");
    }
  });
}

const KOTA = "Salatiga";
const NEGARA = "Indonesia";
const CACHE_KEY = "jadwalSalatTerakhir";

function tampilkanJadwal(t, sumber) {
  $("#jadwal-subuh").text(t.Fajr + " WIB");
  $("#jadwal-dzuhur").text(t.Dhuhr + " WIB");
  $("#jadwal-ashar").text(t.Asr + " WIB");
  $("#jadwal-maghrib").text(t.Maghrib + " WIB");
  $("#jadwal-isya").text(t.Isha + " WIB");
  $("#jadwal-status").text(sumber);
}

function muatJadwalSalat() {
  $("#jadwal-status").text("Memuat jadwal…");

  $.ajax({
    url: "https://api.aladhan.com/v1/timingsByCity",
    method: "GET",
    dataType: "json",
    timeout: 8000,
    data: { city: KOTA, country: NEGARA, method: 20 } // 20 = Kemenag RI
  })
  .done(function (res) {
    const t = res.data.timings;
    localStorage.setItem(CACHE_KEY, JSON.stringify(t));
    tampilkanJadwal(t, "Jadwal untuk " + KOTA + " (diperbarui online)");
  })
  .fail(function () {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      tampilkanJadwal(JSON.parse(cache), "Offline: memakai jadwal terakhir yang tersimpan");
    } else {
      $("#jadwal-status").text("Gagal memuat jadwal. Periksa koneksi internet.");
    }
  });
}

$(document).ready(muatJadwalSalat);