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
   CONFIGURATION — Ubah sesuai kebutuhan
   ═══════════════════════════════════════════════════════ */
const HOST_NAME = "Itsbat";
const HOST_PHONE = "6281234567890";
const EVENT_DATE = new Date("2026-03-22T08:00:00+08:00"); // 22 Maret 2026, 08:00 WITA
const EVENT_END = new Date("2026-03-22T16:00:00+08:00");
const EVENT_LOCATION = "Jl. Soekarno Hatta Km. 4";
const MAPS_URL = "https://maps.app.goo.gl/9ucHiy3NeoXMncKc8";
const AUDIO_SRC = "/audio/lebaran.mp3";

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
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

function fireConfetti() {
  const colors = ["#D97706", "#F59E0B", "#707A5E", "#A65D43"];
  const end = Date.now() + 3500;
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
   DUST PARTICLES
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
   FADE-IN SECTION WRAPPER
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
   CURTAIN FABRIC PANEL (reusable for left/right)
   ═══════════════════════════════════════════════════════ */
function CurtainPanel({ side, phase }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className={`absolute top-0 h-full w-[52%] overflow-hidden ${isLeft ? "left-0" : "right-0"}`}
      animate={
        phase === "opening"
          ? { x: isLeft ? "-108%" : "108%", scaleX: 0.78 }
          : { x: 0, scaleX: 1 }
      }
      transition={{
        duration: 3,
        ease: [0.22, 1, 0.36, 1],
        delay: isLeft ? 0.05 : 0,
      }}
      style={{ transformOrigin: isLeft ? "left center" : "right center" }}
    >
      <div className="absolute inset-0 bg-terracotta" />

      {/* Fabric fold highlights & shadows */}
      <div className="absolute left-[12%] top-0 h-full w-6 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <div className="absolute left-[30%] top-0 h-full w-10 bg-gradient-to-r from-black/[0.06] via-transparent to-black/[0.02]" />
      <div className="absolute left-[50%] top-0 h-full w-5 bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
      <div className="absolute left-[68%] top-0 h-full w-8 bg-gradient-to-r from-black/[0.05] via-transparent to-black/[0.03]" />
      <div className="absolute left-[85%] top-0 h-full w-5 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />

      {/* Edge shadow at center seam */}
      <div
        className={`absolute top-0 h-full w-8 ${
          isLeft
            ? "right-0 bg-gradient-to-l from-black/20 to-transparent"
            : "left-0 bg-gradient-to-r from-black/20 to-transparent"
        }`}
      />

      {/* Top rod shadow */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/15 to-transparent" />

      {/* Bottom drape weight */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />

      {/* Subtle textile texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='white'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   THE REVEAL — Tirai + Amplop 3D + Segel Lilin
   ═══════════════════════════════════════════════════════ */
function TheReveal({ audioRef, onComplete }) {
  const [phase, setPhase] = useState("idle");

  const handleOpen = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("breaking");

    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 900);

    setTimeout(() => {
      setPhase("opening");
      fireConfetti();
    }, 1300);

    setTimeout(() => onComplete(), 4600);
  }, [phase, audioRef, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Curtain panels */}
      <CurtainPanel side="left" phase={phase} />
      <CurtainPanel side="right" phase={phase} />

      {/* Center: Envelope 3D */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-8"
        animate={
          phase === "opening"
            ? { opacity: 0, scale: 0.8, y: 30 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        {/* Guest Label */}
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
            Ahli Surga
          </h2>
        </motion.div>

        {/* 3D Envelope */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 6 }}
          transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
          style={{ perspective: 1000 }}
        >
          <div
            className="relative mx-auto w-72 sm:w-80"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Ground shadow */}
            <div
              className="absolute -bottom-7 left-8 right-8 h-10 rounded-[50%] bg-black/30 blur-2xl"
              style={{ transform: "translateZ(-30px)" }}
            />

            {/* Envelope card */}
            <div
              className="relative overflow-hidden rounded-2xl bg-beige shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
              style={{ transform: "translateZ(0)" }}
            >
              {/* Flap triangle */}
              <div className="relative">
                <div
                  className="h-24 bg-beige-dark sm:h-28"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  }}
                />
                {/* Flap depth gradient */}
                <div
                  className="absolute inset-0 h-24 sm:h-28"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background:
                      "linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.06) 100%)",
                  }}
                />
              </div>

              {/* Wax Seal — at flap tip */}
              <motion.button
                onClick={handleOpen}
                className="absolute left-1/2 top-[56px] z-20 flex h-[68px] w-[68px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-[5px] border-beige bg-gradient-to-br from-amber-light via-amber to-terracotta shadow-[0_8px_25px_rgba(217,119,6,0.4)] sm:top-[64px] sm:h-[74px] sm:w-[74px]"
                animate={
                  phase === "breaking"
                    ? {
                        scale: [1, 1.3, 1.5, 0],
                        rotate: [0, -8, 15, -30],
                        opacity: [1, 1, 0.6, 0],
                      }
                    : { scale: [1, 1.06, 1] }
                }
                transition={
                  phase === "breaking"
                    ? { duration: 0.9, ease: "easeInOut" }
                    : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                }
                whileHover={
                  phase === "idle"
                    ? {
                        scale: 1.12,
                        boxShadow: "0 0 35px rgba(217,119,6,0.5)",
                      }
                    : undefined
                }
              >
                {/* Concentric ring seal pattern */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-white/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
                    <span className="font-playfair text-lg leading-none text-white">
                      ✦
                    </span>
                  </div>
                </div>
              </motion.button>

              {/* Envelope body */}
              <div className="px-6 pb-6 pt-10 text-center">
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
                  Hari Kedua · 22 Maret 2026
                </p>
              </div>

              {/* 3D bottom edge */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-b from-beige-dark/60 to-beige-dark" />
            </div>

            {/* Side thickness illusion */}
            <div
              className="absolute -right-[2px] top-4 bottom-4 w-[3px] rounded-r bg-beige-dark/80"
              style={{ transform: "translateZ(-2px)" }}
            />
            <div
              className="absolute -left-[2px] top-4 bottom-4 w-[3px] rounded-l bg-beige-dark/80"
              style={{ transform: "translateZ(-2px)" }}
            />
          </div>
        </motion.div>

        {/* CTA pulse */}
        <motion.p
          className="mt-10 font-inter text-xs tracking-wider text-beige/40"
          initial={{ opacity: 0 }}
          animate={
            phase === "idle"
              ? { opacity: [0.25, 0.65, 0.25] }
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
            1447 Hijriah
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
   SAMBUTAN
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

      <p className="mx-auto mt-8 max-w-sm font-inter text-sm leading-relaxed text-olive sm:text-base sm:leading-loose">
        <em className="text-terracotta">
          &ldquo;Silaturahmi adalah jembatan menuju keberkahan,&rdquo;
        </em>{" "}
        begitulah petuah bijak dari seorang filsuf Bulgaria.{" "}
        <em className="text-terracotta">
          &ldquo;Sambunglah tali silaturahmi, walaupun dengan senyuman,&rdquo;
        </em>{" "}
        sebab{" "}
        <em className="text-terracotta">
          &ldquo;Liang lahat adalah tempat yang paling sempit, maka luaskanlah
          dengan menyambung silaturahmi.&rdquo;
        </em>
      </p>

      <p className="mx-auto mt-6 max-w-sm font-inter text-sm leading-relaxed text-olive sm:text-base sm:leading-loose">
        Menghargai indahnya kebersamaan di hari kemenangan ini, saya{" "}
        <strong className="font-medium text-olive-dark">{HOST_NAME}</strong>{" "}
        menantikan kehadiran teman-teman di rumah saya untuk merayakan Open
        House Hari Kedua Lebaran. Mari kita meluangkan waktu sejenak untuk
        saling bertegur sapa, bercanda, dan memperluas keberkahan di hari yang
        suci ini.
      </p>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL HINT — "scroll untuk melihat ديتايل"
   ═══════════════════════════════════════════════════════ */
function ScrollHint() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <motion.div
      ref={ref}
      className="py-10 text-center"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="font-inter text-sm text-olive">
          Scroll ke bawah untuk melihat{" "}
          <span
            className="font-playfair text-xl font-medium text-terracotta"
            dir="rtl"
          >
            ديتايل
          </span>
        </p>
        <svg
          className="mx-auto mt-3 h-5 w-5 text-olive/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
          />
        </svg>
      </motion.div>
    </motion.div>
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
          <p className="mt-1 font-inter text-xs leading-relaxed text-olive">
            {extra}
          </p>
        )}
      </div>
    </div>
  );
}

function EventDetails() {
  return (
    <FadeSection className="px-6 py-16 sm:py-20">
      <h2 className="text-center font-playfair text-2xl text-olive-dark sm:text-3xl">
        Detail Acara
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
          value="Minggu, 22 Maret 2026"
          extra="Hari Kedua Lebaran · 2 Syawal 1447 H"
        />
        <DetailCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Waktu"
          value="08:00 — 16:00 WITA"
          extra="InsyAllah tersedia makanan dari western, asia sampai timur tengah"
        />
        <DetailCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          }
          label="Lokasi"
          value={EVENT_LOCATION}
        />
      </div>

      {/* Lokesyen button */}
      <div className="mt-8 flex justify-center">
        <motion.a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-olive-dark px-6 py-3 shadow-md"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg className="h-4 w-4 text-beige" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <span className="font-playfair text-sm italic text-beige">
            Lokesyen
          </span>
        </motion.a>
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   MASONRY PHOTO GALLERY
   ═══════════════════════════════════════════════════════ */
const PHOTOS = [
  { url: "/photos/photo1.jpeg", alt: "Foto 1", span: "row-span-2" },
  { url: "/photos/photo2.jpeg", alt: "Foto 2", span: "" },
  { url: "/photos/photo3.jpeg", alt: "Foto 3", span: "" },
  { url: "/photos/photo4.jpeg", alt: "Foto 4", span: "col-span-2" },
  { url: "/photos/photo5.jpeg", alt: "Foto 5", span: "row-span-2" },
  { url: "/photos/photo6.jpeg", alt: "Foto 6", span: "" },
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
          </motion.div>
        ))}
      </div>
    </FadeSection>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-olive-dark px-6 py-12 text-center">
      <div className="mx-auto flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-white/15" />
        <span className="text-xs text-amber">✦</span>
        <span className="h-px w-8 bg-white/15" />
      </div>
      <p className="mt-4 font-playfair text-sm text-white/30">
        Idul Fitri 1447 H
      </p>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   APP
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
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />

      <AnimatePresence>
        {!revealed && (
          <TheReveal
            key="reveal"
            audioRef={audioRef}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>

      {revealed && (
        <>
          <ScrollProgress />
          <DustParticles />
          <MusicToggle audioRef={audioRef} />

          <div className="relative z-10 mx-auto max-w-md overflow-x-hidden">
            <Hero />
            <Countdown />
            <Sambutan />
            <ScrollHint />
            <EventDetails />
            <Gallery />
          </div>

          <Footer />
        </>
      )}
    </div>
  );
}
