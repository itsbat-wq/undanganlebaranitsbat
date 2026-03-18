import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useInView,
} from "framer-motion";
import confetti from "canvas-confetti";

/* ═══════════════════════════════════════════════════════
   CONFIGURATION — Ubah sesuai kebutuhan Anda
   ═══════════════════════════════════════════════════════ */
const HOST_NAME = "Keluarga Besar [Nama Anda]";
const HOST_PHONE = "6281234567890";
const EVENT_DATE = new Date("2026-03-21T10:00:00+07:00");
const EVENT_END = new Date("2026-03-21T15:00:00+07:00");
const EVENT_LOCATION = "Jl. Raya Indah No. 12, Menteng, Jakarta Pusat";
const AUDIO_SRC = "/audio/lebaran.mp3";

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
function getGuestName() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("to") || "Tamu Undangan";
  } catch {
    return "Tamu Undangan";
  }
}

function calcTimeLeft(target) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function useCountdown(target) {
  const [t, setT] = useState(() => calcTimeLeft(target));
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function getMapsUrl() {
  const encoded = encodeURIComponent(EVENT_LOCATION);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS
    ? `maps://maps.apple.com/?q=${encoded}`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

function getGCalUrl() {
  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Open House Lebaran Hari Kedua",
    dates: `${fmt(EVENT_DATE)}/${fmt(EVENT_END)}`,
    details: `Open House Lebaran di kediaman ${HOST_NAME}`,
    location: EVENT_LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function downloadICal() {
  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Undangan Lebaran//ID",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(EVENT_DATE)}`,
    `DTEND:${fmt(EVENT_END)}`,
    "SUMMARY:Open House Lebaran Hari Kedua",
    `DESCRIPTION:Open House Lebaran di kediaman ${HOST_NAME}`,
    `LOCATION:${EVENT_LOCATION}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ical], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), {
    href: url,
    download: "open-house-lebaran.ics",
  }).click();
  URL.revokeObjectURL(url);
}

function fireConfetti() {
  const colors = ["#D97706", "#F59E0B", "#707A5E", "#A65D43"];
  const end = Date.now() + 3000;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/* ═══════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] origin-left bg-terracotta"
      style={{ scaleX }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   DUST PARTICLES (Light dust atmosphere)
   ═══════════════════════════════════════════════════════ */
function DustParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 3 + 1,
        dur: Math.random() * 18 + 14,
        delay: Math.random() * 16,
        drift: (Math.random() - 0.5) * 60,
        opacity: Math.random() * 0.12 + 0.04,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-amber"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `dust-float ${p.dur}s ${p.delay}s infinite linear`,
            "--dust-drift": `${p.drift}px`,
            "--dust-opacity": p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FLOATING MUSIC TOGGLE
   ═══════════════════════════════════════════════════════ */
function MusicToggle({ audioRef }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [audioRef]);

  const toggle = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };

  return (
    <motion.button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-white shadow-lg"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      aria-label={playing ? "Matikan musik" : "Nyalakan musik"}
    >
      {playing && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-terracotta"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {playing ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════
   FADE-IN SECTION WRAPPER (scroll-triggered)
   ═══════════════════════════════════════════════════════ */
function FadeSection({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   THE REVEAL — Tirai + Amplop + Segel Lilin
   ═══════════════════════════════════════════════════════ */
function TheReveal({ audioRef, onComplete }) {
  const [phase, setPhase] = useState("idle");
  const guestName = getGuestName();

  const handleOpen = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("breaking");

    setTimeout(() => {
      setPhase("opening");
      audioRef.current?.play().catch(() => {});
      fireConfetti();
    }, 700);

    setTimeout(() => onComplete(), 2400);
  }, [phase, audioRef, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left curtain */}
      <motion.div
        className="absolute left-0 top-0 h-full w-1/2 bg-terracotta"
        animate={phase === "opening" ? { x: "-100%" } : { x: 0 }}
        transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "20px 20px" }} />
      </motion.div>

      {/* Right curtain */}
      <motion.div
        className="absolute right-0 top-0 h-full w-1/2 bg-terracotta"
        animate={phase === "opening" ? { x: "100%" } : { x: 0 }}
        transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "20px 20px" }} />
      </motion.div>

      {/* Center: Envelope + Seal */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-8"
        animate={
          phase === "opening"
            ? { opacity: 0, scale: 0.85 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.6 }}
      >
        {/* Guest Name */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="font-inter text-[11px] tracking-[0.3em] text-beige/50 uppercase">
            Kepada Yth.
          </p>
          <h2 className="mt-2 font-playfair text-3xl text-beige sm:text-4xl">
            {guestName}
          </h2>
        </motion.div>

        {/* Envelope Card */}
        <motion.div
          className="relative mx-auto w-72 overflow-hidden rounded-2xl bg-beige shadow-2xl sm:w-80"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {/* Envelope flap */}
          <div
            className="h-20 bg-beige-dark sm:h-24"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />

          {/* Wax Seal — positioned at the flap's tip */}
          <motion.button
            onClick={handleOpen}
            className="absolute left-1/2 top-[52px] z-20 flex h-16 w-16 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-4 border-beige bg-gradient-to-br from-amber-light via-amber to-terracotta shadow-xl sm:top-[60px] sm:h-[70px] sm:w-[70px]"
            animate={
              phase === "breaking"
                ? {
                    scale: [1, 1.4, 0],
                    rotate: [0, 12, -25],
                    opacity: [1, 0.8, 0],
                  }
                : { scale: [1, 1.06, 1] }
            }
            transition={
              phase === "breaking"
                ? { duration: 0.7, ease: "easeInOut" }
                : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }
            whileHover={phase === "idle" ? { scale: 1.12, boxShadow: "0 0 30px rgba(217,119,6,0.35)" } : undefined}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30">
              <span className="font-playfair text-xl leading-none text-white">
                ✦
              </span>
            </div>
          </motion.button>

          {/* Envelope body */}
          <div className="px-6 pb-6 pt-8 text-center">
            <p className="font-inter text-[10px] tracking-[0.3em] text-olive uppercase">
              Undangan
            </p>
            <div className="mx-auto mt-3 flex items-center justify-center gap-2">
              <span className="h-px w-6 bg-amber/30" />
              <span className="text-[10px] text-amber">✦</span>
              <span className="h-px w-6 bg-amber/30" />
            </div>
            <h3 className="mt-3 font-playfair text-lg text-olive-dark">
              Open House Lebaran
            </h3>
            <p className="mt-1 font-inter text-xs text-olive">
              Hari Kedua · 21 Maret 2026
            </p>
          </div>
        </motion.div>

        {/* Call-to-action */}
        <motion.p
          className="mt-8 font-inter text-xs tracking-wider text-beige/40"
          initial={{ opacity: 0 }}
          animate={
            phase === "idle"
              ? { opacity: [0.3, 0.7, 0.3] }
              : { opacity: 0 }
          }
          transition={
            phase === "idle"
              ? { duration: 2.5, repeat: Infinity }
              : { duration: 0.3 }
          }
        >
          Ketuk segel untuk membuka undangan
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-olive-dark/60 via-olive-dark/30 to-beige" />

      <div className="relative z-10 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          <p className="font-inter text-xs tracking-[0.3em] text-white/60 uppercase">
            1446 Hijriah
          </p>
        </motion.div>

        <motion.h1
          className="mt-4 font-playfair text-4xl leading-tight font-medium text-white sm:text-5xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        >
          Selamat Hari Raya
          <br />
          Idul Fitri
        </motion.h1>

        <motion.div
          className="mx-auto mt-6 h-px w-20 bg-white/30"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        />

        <motion.p
          className="mt-6 font-playfair text-xl italic text-white/80 sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1, ease: "easeOut" }}
        >
          Mohon Maaf Lahir &amp; Batin
        </motion.p>

        <motion.p
          className="mt-5 font-inter text-[11px] tracking-[0.25em] text-white/40 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          Open House — Hari Kedua Lebaran
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span className="font-inter text-[10px] tracking-widest text-white/30 uppercase">
          Scroll
        </span>
        <motion.div
          className="h-7 w-px bg-white/30"
          animate={{ scaleY: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   COUNTDOWN TIMER
   ═══════════════════════════════════════════════════════ */
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white/60 shadow-sm backdrop-blur-sm sm:h-20 sm:w-20">
        <span className="font-playfair text-2xl font-semibold text-terracotta sm:text-3xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 font-inter text-[10px] tracking-[0.2em] text-olive uppercase">
        {label}
      </span>
    </div>
  );
}

function Countdown() {
  const t = useCountdown(EVENT_DATE);
  return (
    <FadeSection className="px-6 py-16 text-center sm:py-20">
      <p className="font-inter text-[11px] tracking-[0.3em] text-olive uppercase">
        Hitung Mundur
      </p>
      <h2 className="mt-2 font-playfair text-2xl text-olive-dark sm:text-3xl">
        Menuju Hari Kedua
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-6 bg-amber/30" />
      </div>
      <div className="mt-8 flex justify-center gap-3 sm:gap-5">
        <CountdownUnit value={t.days} label="Hari" />
        <CountdownUnit value={t.hours} label="Jam" />
        <CountdownUnit value={t.minutes} label="Menit" />
        <CountdownUnit value={t.seconds} label="Detik" />
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   SAMBUTAN / GREETING
   ═══════════════════════════════════════════════════════ */
function Sambutan() {
  return (
    <FadeSection className="px-6 py-16 text-center sm:py-20">
      <h2 className="font-playfair text-2xl text-olive-dark sm:text-3xl">
        Assalamu&apos;alaikum
      </h2>
      <p className="mt-1 font-playfair text-sm italic text-olive">
        Warahmatullahi Wabarakatuh
      </p>
      <div className="mx-auto mt-5 flex items-center justify-center gap-2">
        <span className="h-px w-8 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-8 bg-amber/30" />
      </div>
      <p className="mx-auto mt-6 max-w-sm font-inter text-sm leading-relaxed text-olive sm:text-base sm:leading-loose">
        Dengan penuh rasa syukur kepada Allah SWT atas nikmat dan keberkahan
        di hari yang fitri ini, kami mengundang Bapak/Ibu/Saudara/i untuk
        hadir dan berbagi kebahagiaan dalam acara{" "}
        <strong className="font-medium text-olive-dark">
          Open House Hari Kedua Lebaran
        </strong>{" "}
        di kediaman kami.
      </p>
      <p className="mx-auto mt-4 max-w-sm font-inter text-sm leading-relaxed text-olive sm:text-base sm:leading-loose">
        Kehadiran Anda akan melengkapi kebahagiaan dan menjadikan silaturahmi
        ini semakin bermakna.
      </p>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   EVENT DETAILS
   ═══════════════════════════════════════════════════════ */
function DetailCard({ icon, label, value, extra }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/60 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-inter text-[10px] tracking-[0.2em] text-olive uppercase">
          {label}
        </p>
        <p className="mt-0.5 font-playfair text-base font-medium text-olive-dark sm:text-lg">
          {value}
        </p>
        {extra && (
          <p className="mt-0.5 font-inter text-xs text-olive">{extra}</p>
        )}
      </div>
    </div>
  );
}

function EventDetails() {
  return (
    <FadeSection className="px-6 py-16 sm:py-20">
      <p className="text-center font-inter text-[11px] tracking-[0.3em] text-olive uppercase">
        Detail Acara
      </p>
      <h2 className="mt-2 text-center font-playfair text-2xl text-olive-dark sm:text-3xl">
        Informasi Kehadiran
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-6 bg-amber/30" />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <DetailCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          label="Tanggal"
          value="Sabtu, 21 Maret 2026"
          extra="Hari Kedua Lebaran · 1 Syawal 1446 H"
        />
        <DetailCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Waktu"
          value="10:00 — 15:00 WIB"
          extra="Makan siang tersedia"
        />
        <DetailCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
          label="Lokasi"
          value={EVENT_LOCATION.split(",")[0]}
          extra={EVENT_LOCATION.split(",").slice(1).join(",").trim()}
        />
      </div>

      {/* Smart Navigation Button */}
      <div className="mt-8 flex justify-center">
        <motion.a
          href={getMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-olive-dark px-6 py-3 font-inter text-sm font-medium text-beige shadow-md"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          Petunjuk Lokasi
        </motion.a>
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   SAVE THE DATE — Google Calendar + iCal
   ═══════════════════════════════════════════════════════ */
function SaveTheDate() {
  return (
    <FadeSection className="px-6 py-16 text-center sm:py-20">
      <p className="font-inter text-[11px] tracking-[0.3em] text-olive uppercase">
        Simpan Tanggal
      </p>
      <h2 className="mt-2 font-playfair text-2xl text-olive-dark sm:text-3xl">
        Save the Date
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-6 bg-amber/30" />
      </div>
      <p className="mx-auto mt-5 max-w-xs font-inter text-sm text-olive">
        Tambahkan ke kalender Anda agar tidak terlewat.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <motion.a
          href={getGCalUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-5 py-3 font-inter text-sm font-medium text-olive-dark shadow-sm backdrop-blur-sm sm:w-auto"
          whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.9)" }}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="h-4 w-4 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Google Calendar
        </motion.a>

        <motion.button
          onClick={downloadICal}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-5 py-3 font-inter text-sm font-medium text-olive-dark shadow-sm backdrop-blur-sm sm:w-auto"
          whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.9)" }}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="h-4 w-4 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Apple / iCal
        </motion.button>
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   MASONRY PHOTO GALLERY
   ═══════════════════════════════════════════════════════ */
const PHOTOS = [
  { url: "https://images.unsplash.com/photo-1590076215667-875c2d76b544?w=600&q=80", alt: "Persiapan Lebaran", span: "row-span-2" },
  { url: "https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=600&q=80", alt: "Dekorasi Rumah", span: "" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", alt: "Hidangan Spesial", span: "" },
  { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", alt: "Sajian Lebaran", span: "col-span-2" },
  { url: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=600&q=80", alt: "Kue Lebaran", span: "row-span-2" },
  { url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80", alt: "Silaturahmi", span: "" },
];

function Gallery() {
  return (
    <FadeSection className="py-16 sm:py-20">
      <p className="px-6 text-center font-inter text-[11px] tracking-[0.3em] text-olive uppercase">
        Galeri
      </p>
      <h2 className="mt-2 px-6 text-center font-playfair text-2xl text-olive-dark sm:text-3xl">
        Momen Kebersamaan
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-6 bg-amber/30" />
      </div>

      <div className="mt-8 grid auto-rows-[140px] grid-cols-2 gap-2 px-3 sm:auto-rows-[180px]">
        {PHOTOS.map((p, i) => (
          <motion.div
            key={i}
            className={`group relative overflow-hidden rounded-xl ${p.span}`}
            whileHover={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={p.url}
              alt={p.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <p className="absolute bottom-0 left-0 w-full translate-y-full p-3 font-inter text-[11px] tracking-wider text-white/90 transition-transform duration-500 group-hover:translate-y-0">
              {p.alt}
            </p>
          </motion.div>
        ))}
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   DIGITAL GUEST BOOK — Form → WhatsApp
   ═══════════════════════════════════════════════════════ */
function GuestBook() {
  const guestName = getGuestName();
  const [name, setName] = useState(
    guestName !== "Tamu Undangan" ? guestName : "",
  );
  const [message, setMessage] = useState("");
  const [attendance, setAttendance] = useState("hadir");

  const handleSubmit = (e) => {
    e.preventDefault();
    const status =
      attendance === "hadir"
        ? "Insya Allah akan hadir"
        : "Mohon maaf berhalangan hadir";
    const text = encodeURIComponent(
      `Halo ${HOST_NAME},\n\nSaya *${name}* ingin mengucapkan:\n"${message}"\n\n${status} di acara Open House Lebaran hari kedua.\nTerima kasih atas undangannya! 🙏`,
    );
    window.open(`https://wa.me/${HOST_PHONE}?text=${text}`, "_blank");
  };

  return (
    <FadeSection className="px-6 py-16 sm:py-20">
      <p className="text-center font-inter text-[11px] tracking-[0.3em] text-olive uppercase">
        Buku Tamu
      </p>
      <h2 className="mt-2 text-center font-playfair text-2xl text-olive-dark sm:text-3xl">
        Ucapan &amp; Kehadiran
      </h2>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-6 bg-amber/30" />
        <span className="text-[10px] text-amber">✦</span>
        <span className="h-px w-6 bg-amber/30" />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          required
          className="w-full rounded-xl border border-beige-dark bg-white/60 px-4 py-3 font-inter text-sm text-olive-dark outline-none backdrop-blur-sm transition-all placeholder:text-olive/40 focus:border-terracotta/40 focus:ring-2 focus:ring-terracotta/10"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis ucapan & doa Anda..."
          required
          rows={3}
          className="w-full resize-none rounded-xl border border-beige-dark bg-white/60 px-4 py-3 font-inter text-sm text-olive-dark outline-none backdrop-blur-sm transition-all placeholder:text-olive/40 focus:border-terracotta/40 focus:ring-2 focus:ring-terracotta/10"
        />

        {/* Attendance Radio */}
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="attendance"
              value="hadir"
              checked={attendance === "hadir"}
              onChange={() => setAttendance("hadir")}
              className="peer sr-only"
            />
            <div className="rounded-xl border-2 border-transparent bg-white/60 px-4 py-3 text-center font-inter text-sm text-olive shadow-sm transition-all peer-checked:border-terracotta peer-checked:bg-terracotta/10 peer-checked:text-terracotta">
              Akan Hadir
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="attendance"
              value="tidak"
              checked={attendance === "tidak"}
              onChange={() => setAttendance("tidak")}
              className="peer sr-only"
            />
            <div className="rounded-xl border-2 border-transparent bg-white/60 px-4 py-3 text-center font-inter text-sm text-olive shadow-sm transition-all peer-checked:border-terracotta peer-checked:bg-terracotta/10 peer-checked:text-terracotta">
              Berhalangan
            </div>
          </label>
        </div>

        <motion.button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta py-3.5 font-inter text-sm font-medium text-beige shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Kirim Ucapan via WhatsApp
        </motion.button>
      </form>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-olive-dark px-6 py-16 text-center sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-white/15" />
          <span className="text-amber text-xs">✦</span>
          <span className="h-px w-8 bg-white/15" />
        </div>

        <p className="font-inter text-[10px] tracking-[0.3em] text-white/30 uppercase">
          Dengan penuh kasih
        </p>

        <h3 className="mt-4 font-playfair text-2xl font-medium text-white/90 sm:text-3xl">
          {HOST_NAME.split("[")[0]}
          <br />
          <span className="text-amber">{HOST_NAME.includes("[") ? "[Nama Anda]" : ""}</span>
        </h3>

        <div className="mt-8 h-px w-full bg-white/10" />

        <p className="mt-6 font-inter text-[11px] text-white/25">
          Idul Fitri 1446 H · Hari Kedua Lebaran
        </p>
        <p className="mt-2 font-inter text-[10px] text-white/15">
          Dibuat dengan ❤️
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   APP — Main Entry
   ═══════════════════════════════════════════════════════ */
export default function App() {
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = revealed ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [revealed]);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
  }, []);

  return (
    <div className="min-h-screen bg-beige font-inter text-olive-dark">
      {/* Background Music (placeholder — ganti dengan file audio Anda) */}
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />

      {/* The Reveal: Curtain + Envelope */}
      <AnimatePresence>
        {!revealed && (
          <TheReveal
            key="reveal"
            audioRef={audioRef}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {revealed && (
        <>
          <ScrollProgress />
          <DustParticles />
          <MusicToggle audioRef={audioRef} />

          <div className="relative z-10 mx-auto max-w-md overflow-x-hidden">
            <Hero />
            <Countdown />
            <Sambutan />
            <EventDetails />
            <SaveTheDate />
            <Gallery />
            <GuestBook />
          </div>

          <Footer />
        </>
      )}
    </div>
  );
}
