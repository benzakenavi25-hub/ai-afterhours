(() => {
  "use strict";

  document.documentElement.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---------- Nav ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && menu.classList.contains("open")) setOpen(false);
    });
  }

  /* ---------- Hero entrance ---------- */
  function initHeroSplit(animate = true) {
    const h1 = document.querySelector(".hero h1[data-split]");
    if (!h1) return;
    h1.classList.remove("go");

    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement("span");
            span.className = "word";
            span.textContent = part;
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.classList.contains("text-grad")) child.classList.add("word");
          else walk(child);
        }
      });
    };
    walk(h1);

    const words = h1.querySelectorAll(".word");
    const runFade = () => {
      document.querySelectorAll(".hero-fade").forEach((el) => {
        el.classList.add("go");
        el.style.animationDelay = "0ms";
      });
    };

    if (!animate || reduceMotion) {
      words.forEach((w) => { w.style.animationDelay = "0ms"; });
      h1.classList.add("go");
      runFade();
      return;
    }

    words.forEach((w, i) => { w.style.animationDelay = `${i * 60}ms`; });
    const wordsEnd = words.length * 60 + 300;
    requestAnimationFrame(() => h1.classList.add("go"));
    document.querySelectorAll(".hero-fade").forEach((el, i) => {
      el.style.animationDelay = `${Math.min(wordsEnd + i * 80, 820)}ms`;
      requestAnimationFrame(() => el.classList.add("go"));
    });
  }

  initHeroSplit(true);

  /* ---------- Scroll reveal & counters ---------- */
  const formatNum = (n, decimals) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    if (reduceMotion) { el.textContent = formatNum(target, decimals); return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(target * eased, decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entry.target.querySelectorAll("[data-count]").forEach(runCounter);
        if (entry.target.matches("[data-count]")) runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal, [data-count]:not(.reveal [data-count])").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  const mobileCta = document.querySelector(".mobile-cta");
  const heroSection = document.querySelector(".hero");
  const mobileQuery = window.matchMedia("(max-width: 768px)");
  if (mobileCta && heroSection && "IntersectionObserver" in window) {
    const syncBar = () => {
      if (!mobileQuery.matches) {
        mobileCta.classList.remove("is-on");
        document.body.classList.remove("has-mobile-cta");
      }
    };
    const barIo = new IntersectionObserver((entries) => {
      if (!mobileQuery.matches) return;
      const on = !entries[0].isIntersecting;
      mobileCta.classList.toggle("is-on", on);
      document.body.classList.toggle("has-mobile-cta", on);
    }, { threshold: 0 });
    barIo.observe(heroSection);
    mobileQuery.addEventListener("change", syncBar);
  }

  /* ---------- Hero orb tilt ---------- */
  const heroEl = document.querySelector(".home-frame") || document.querySelector(".hero");
  if (heroEl && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let raf = 0;
    let mx = 0;
    let my = 0;
    const paint = () => {
      heroEl.style.setProperty("--mx", mx.toFixed(4));
      heroEl.style.setProperty("--my", my.toFixed(4));
      raf = 0;
    };
    heroEl.addEventListener("mousemove", (e) => {
      const r = heroEl.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    heroEl.addEventListener("mouseleave", () => {
      mx = 0;
      my = 0;
      if (!raf) raf = requestAnimationFrame(paint);
    });
  }

  /* ---------- Parallax glow ---------- */
  const glows = document.querySelectorAll(".hero-glow");
  if (glows.length && !reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY * 0.3;
        glows.forEach((g) => { g.style.transform = `translate3d(0, ${y}px, 0)`; });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Live Call Player ---------- */
  const SCENARIOS = {
    garage: {
      title: "מוסך אורן, ראשון לציון",
      place: "מוסך",
      meta: "שיחה נכנסת · יום ו׳ 21:47",
      result: { title: "תור נקבע: יום א׳ 08:30", sub: "נשלח SMS עם האישור והכתובת" },
      lines: [
        ["caller", "היי, נתקע לי נורה במנוע, זה רציני?"],
        ["bot", "שלום, הגעתם למוסך אורן. אני העוזרת הדיגיטלית. איך אפשר לעזור?"],
        ["caller", "יש מקום מחר ב־08:30?"],
        ["bot", "כן, נקבע לך ליום א׳ ב־08:30. אשלח לך אישור והכתובת."]
      ]
    },
    clinic: {
      title: "מרפאת שיניים ד״ר לוי, חיפה",
      place: "מרפאה",
      meta: "שיחה נכנסת · שבת 10:12",
      result: { title: "תור נקבע: יום א׳ 08:00", sub: "נשלח SMS עם האישור" },
      lines: [
        ["caller", "כואבת לי שן מאתמול בלילה, זה דחוף?"],
        ["bot", "שלום, הגעתם למרפאת ד״ר לוי. אני העוזרת הדיגיטלית. איך אפשר לעזור?"],
        ["caller", "יש תור ראשון מחר ב־08:00?"],
        ["bot", "כן, נקבע לך ליום א׳ ב־08:00. אשלח אישור לנייד."]
      ]
    },
    realestate: {
      title: "קבוצת נדל״ן אופק, תל אביב",
      place: "נדל״ן",
      meta: "שיחה נכנסת · חוה״מ 19:30",
      result: { title: "סיור נקבע: יום ה׳ 18:00", sub: "הליד הועבר לצוות עם התקציב" },
      lines: [
        ["caller", "ראיתי 4 חדרים בפלורנטין, זה עוד רלוונטי?"],
        ["bot", "שלום, הגעתם לאופק נדל״ן. הדירה זמינה. לקנות או לשכור?"],
        ["caller", "לקנות, עד 3.2 מיליון. אפשר ביום ה׳ בערב?"],
        ["bot", "כן, סיור ביום ה׳ ב־18:00 עם אבי. הוא יאשר מחר."]
      ]
    }
  };

  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>';

  const clockOf = (meta) => (meta.match(/(\d{1,2}:\d{2})/) || ["", ""])[1];

  document.querySelectorAll("[data-player]").forEach((root) => {
    const tabs = root.querySelectorAll(".player-tab");
    const playBtn = root.querySelector(".play-btn");
    const wave = root.querySelector(".waveform");
    const transcript = root.querySelector(".transcript");
    const titleEl = root.querySelector("[data-title]");
    const metaEl = root.querySelector("[data-meta]");
    const timeEl = root.querySelector(".player-time");
    const resultsEl = root.querySelector("[data-results]");
    const resultTitle = root.querySelector("[data-result-title]");
    const resultSub = root.querySelector("[data-result-sub]");
    const headingEl = document.getElementById("demo-heading");
    const BARS = 42;
    const LINE_MS = 1700;
    const TAIL_MS = 650;
    const PREVIEW = 2;

    wave.innerHTML = "";
    const seed = [...Array(BARS)].map((_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75);
    const idleHeight = (i) => Math.round(34 + seed[i] * 52);
    const bars = seed.map((_, i) => {
      const b = document.createElement("i");
      b.style.height = `${idleHeight(i)}%`;
      wave.appendChild(b);
      return b;
    });

    let key = root.dataset.scenario || "garage";
    let lines = [];
    let duration = 0;
    let lineEls = [];
    let raf = null;
    let playing = false;
    let started = false;
    let finished = false;
    let startedAt = 0;
    let elapsedBefore = 0;
    let resultAt = 0;

    const fmt = (ms) => {
      const s = Math.max(0, Math.floor(ms / 1000));
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    };

    const setHeading = (sc) => {
      if (!headingEl) return;
      const clock = clockOf(sc.meta);
      const next = `תקשיבו לבוט עונה ל${sc.place} ב־${clock}`;
      if (headingEl.textContent === next) return;
      headingEl.replaceChildren(document.createTextNode(`תקשיבו לבוט עונה ל${sc.place} ב־`));
      const time = document.createElement("bdi");
      time.dir = "ltr";
      time.textContent = clock;
      headingEl.append(time);
    };

    const loadScript = () => {
      const sc = SCENARIOS[key];
      lines = sc.lines.map(([who, text], index) => ({
        who,
        text,
        at: index * LINE_MS,
        dur: LINE_MS
      }));
      resultAt = lines.length * LINE_MS;
      duration = resultAt + TAIL_MS;
    };

    const paintIdleWave = () => {
      bars.forEach((b, i) => {
        b.className = "ready";
        b.style.height = `${idleHeight(i)}%`;
      });
    };

    const paintLiveWave = () => {
      const t = performance.now() / 150;
      bars.forEach((b, i) => {
        b.className = "ready";
        const wobble = reduceMotion ? 0 : Math.abs(Math.sin(t + i * 0.55)) * 26;
        b.style.height = `${Math.round(Math.min(100, 22 + seed[i] * 40 + wobble))}%`;
      });
    };

    const buildTranscript = () => {
      lineEls = lines.map((line) => {
        const el = document.createElement("div");
        el.className = `call-line is-${line.who}`;
        el.hidden = true;
        const who = document.createElement("span");
        who.className = "call-who";
        who.textContent = line.who === "bot" ? "בוט" : "לקוח";
        const text = document.createElement("p");
        text.className = "call-text";
        text.textContent = line.text;
        el.append(who, text);
        return el;
      });
      transcript.replaceChildren(...lineEls);
    };

    const fillResult = (sc) => {
      if (resultTitle) resultTitle.textContent = `✓ ${sc.result.title}`;
      if (resultSub) resultSub.textContent = sc.result.sub;
    };

    const showLines = (count, active) => {
      lineEls.forEach((el, i) => {
        el.hidden = i >= count;
        const on = i === active;
        el.classList.toggle("is-active", on);
        if (on) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    };

    const showPreview = () => {
      const count = Math.min(PREVIEW, lineEls.length);
      showLines(count, count - 1);
      if (resultsEl) resultsEl.hidden = true;
    };

    const highlight = (elapsed, isFinished) => {
      const count = isFinished ? lineEls.length : lines.filter((line) => elapsed >= line.at).length;
      const active = !isFinished && count > 0 && elapsed < lines[count - 1].at + lines[count - 1].dur ? count - 1 : -1;
      showLines(count, active);
      if (resultsEl) resultsEl.hidden = !(isFinished || elapsed >= resultAt);
    };

    const frame = () => {
      const elapsed = Math.min(duration, elapsedBefore + (performance.now() - startedAt));
      paintLiveWave();
      timeEl.textContent = `${fmt(elapsed)} / ${fmt(duration)}`;
      highlight(elapsed, false);
      if (elapsed >= duration) {
        finish();
        return;
      }
      if (playing) raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (playing) elapsedBefore += performance.now() - startedAt;
      playing = false;
      root.classList.remove("playing");
      cancelAnimationFrame(raf);
    };

    const reset = () => {
      stop();
      started = false;
      finished = false;
      elapsedBefore = 0;
      root.classList.remove("is-live", "is-done");
      const sc = SCENARIOS[key];
      loadScript();
      titleEl.textContent = sc.title;
      metaEl.textContent = sc.meta;
      setHeading(sc);
      fillResult(sc);
      buildTranscript();
      showPreview();
      paintIdleWave();
      timeEl.textContent = `00:00 / ${fmt(duration)}`;
      playBtn.innerHTML = ICON_PLAY;
      playBtn.setAttribute("aria-label", "השמע שיחה לדוגמה");
    };

    const play = () => {
      if (finished || !started) {
        elapsedBefore = 0;
        finished = false;
        showLines(0, -1);
        if (resultsEl) resultsEl.hidden = true;
      }
      playing = true;
      started = true;
      root.classList.add("playing", "is-live");
      root.classList.remove("is-done");
      startedAt = performance.now();
      playBtn.innerHTML = ICON_PAUSE;
      playBtn.setAttribute("aria-label", "השהה");
      raf = requestAnimationFrame(frame);
    };

    const pause = () => {
      stop();
      paintIdleWave();
      playBtn.innerHTML = ICON_PLAY;
      playBtn.setAttribute("aria-label", "המשך השמעה");
    };

    const finish = () => {
      stop();
      finished = true;
      elapsedBefore = duration;
      root.classList.remove("is-live");
      root.classList.add("is-done");
      paintIdleWave();
      timeEl.textContent = `${fmt(duration)} / ${fmt(duration)}`;
      highlight(duration, true);
      playBtn.innerHTML = ICON_REPLAY;
      playBtn.setAttribute("aria-label", "השמע שוב");
    };

    playBtn.addEventListener("click", () => (playing ? pause() : play()));
    root.querySelector(".player-tabs")?.addEventListener("keydown", (e) => {
      const list = [...tabs];
      const i = list.indexOf(document.activeElement);
      if (i < 0) return;
      const dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      const next = list[(i + dir + list.length) % list.length];
      next.focus();
      next.click();
    });
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
        if (tab.id) transcript.setAttribute("aria-labelledby", tab.id);
        key = tab.dataset.key;
        reset();
      });
    });
    reset();
  });

  /* ---------- Demo form (two-step) ---------- */
  const FREE_DOMAINS = ["gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.il", "walla.co.il", "walla.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "me.com", "aol.com", "012.net.il", "bezeqint.net", "netvision.net.il", "zahav.net.il", "gmx.com", "proton.me", "protonmail.com"];

  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    const steps = form.querySelectorAll(".form-step");
    const bar = form.querySelector(".form-progress .bar i");
    const stepLabel = form.querySelector("[data-step-label]");

    const setError = (input, msg) => {
      const field = input.closest(".field");
      const err = field.querySelector(".error");
      field.classList.toggle("invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
      return !msg;
    };

    const validate = (input) => {
      const v = input.value.trim();
      if (input.required && !v) return setError(input, "שדה חובה");
      if (input.type === "email" && v) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setError(input, "כתובת המייל לא תקינה");
        const domain = v.split("@")[1].toLowerCase();
        if (FREE_DOMAINS.includes(domain)) return setError(input, "נא להזין מייל עסקי");
      }
      if (input.type === "tel" && v && !/^0\d{1,2}-?\d{7}$/.test(v.replace(/\s/g, ""))) return setError(input, "מספר טלפון לא תקין");
      return setError(input, "");
    };

    form.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", () => {
        if (input.type === "email") {
          const v = input.value.trim();
          const domain = (v.split("@")[1] || "").toLowerCase();
          if (FREE_DOMAINS.includes(domain)) { setError(input, "נא להזין מייל עסקי"); return; }
        }
        if (input.closest(".field").classList.contains("invalid")) validate(input);
      });
      input.addEventListener("blur", () => { if (input.value) validate(input); });
    });

    const validateStep = (step) => {
      let firstBad = null;
      step.querySelectorAll("input, select").forEach((i) => { if (!validate(i) && !firstBad) firstBad = i; });
      if (firstBad) firstBad.focus();
      return !firstBad;
    };

    const goTo = (n) => {
      steps.forEach((s, i) => { s.hidden = i !== n; });
      if (bar) bar.style.width = `${((n + 1) / steps.length) * 100}%`;
      if (stepLabel) stepLabel.textContent = `שלב ${n + 1} מתוך ${steps.length}`;
      const first = steps[n].querySelector("input, select");
      if (first) first.focus({ preventScroll: true });
    };

    form.querySelector("[data-next]")?.addEventListener("click", () => {
      if (validateStep(steps[0])) goTo(1);
    });
    form.querySelector("[data-back]")?.addEventListener("click", () => goTo(0));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!steps[1].hidden && !validateStep(steps[1])) return;
      if (steps[1].hidden) { if (validateStep(steps[0])) goTo(1); return; }
      const btn = form.querySelector('[type="submit"]');
      btn.classList.add("loading");
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> שולח...';
      const name = form.querySelector('[name="name"]').value.trim().split(" ")[0];
      try { sessionStorage.setItem("ah_name", name); } catch (_) {}
      setTimeout(() => { window.location.href = "thanks.html"; }, 700);
    });
  });

  /* ---------- Pricing calculator ---------- */
  const calc = document.querySelector("[data-calc]");
  if (calc) {
    // Placeholder pricing until the client approves real numbers.
    const TIERS = [
      { max: 150, plan: "Starter", base: 149, perCall: 4.9 },
      { max: 600, plan: "Growth", base: 349, perCall: 3.9 },
      { max: Infinity, plan: "Scale", base: 790, perCall: 2.9 }
    ];
    const range = calc.querySelector('input[type="range"]');
    const out = calc.querySelector("output");
    const elPlan = calc.querySelector("[data-plan]");
    const elPer = calc.querySelector("[data-per]");
    const elBase = calc.querySelector("[data-base]");
    const elTotal = calc.querySelector("[data-total]");
    const ils = (n, d = 0) => `₪${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;

    const update = () => {
      const calls = Number(range.value);
      const tier = TIERS.find((t) => calls <= t.max);
      const total = tier.base + calls * tier.perCall;
      out.textContent = calls.toLocaleString("en-US");
      elPlan.textContent = tier.plan;
      elPer.textContent = ils(tier.perCall, 2);
      elBase.textContent = ils(tier.base);
      elTotal.textContent = ils(Math.round(total));
      const pct = ((calls - range.min) / (range.max - range.min)) * 100;
      range.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
      range.setAttribute("aria-valuetext", `${calls} שיחות בחודש, ${ils(Math.round(total))} לחודש`);
    };
    range.addEventListener("input", update);
    update();
  }

  /* ---------- Thank-you page ---------- */
  const nameSlot = document.querySelector("[data-name]");
  if (nameSlot) {
    try {
      const n = sessionStorage.getItem("ah_name");
      if (n) nameSlot.textContent = `, ${n}`;
    } catch (_) {}
  }

  const cal = document.querySelector("[data-cal]");
  if (cal) {
    const daysEl = cal.querySelector(".cal-days");
    const slotsEl = cal.querySelector(".cal-slots");
    const confirmBtn = cal.querySelector("[data-confirm]");
    const summary = cal.querySelector("[data-summary]");
    const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    const SLOTS = ["09:00", "09:30", "10:15", "11:00", "12:30", "14:00", "15:15", "16:00", "17:30"];
    let selDay = null, selSlot = null;

    const days = [];
    const d = new Date();
    while (days.length < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 5 && d.getDay() !== 6) days.push(new Date(d));
    }

    const refresh = () => {
      confirmBtn.disabled = !(selDay && selSlot);
      confirmBtn.style.opacity = confirmBtn.disabled ? ".5" : "1";
      summary.textContent = selDay && selSlot
        ? `יום ${DAY_NAMES[selDay.getDay()]} ${selDay.getDate()}/${selDay.getMonth() + 1} בשעה ${selSlot}`
        : "בחרו יום ושעה";
    };

    const renderSlots = (dayIdx) => {
      slotsEl.innerHTML = "";
      SLOTS.filter((_, i) => (i + dayIdx) % 3 !== 0).forEach((s) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "cal-slot"; b.textContent = s;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          slotsEl.querySelectorAll(".cal-slot").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          selSlot = s; refresh();
        });
        slotsEl.appendChild(b);
      });
    };

    days.forEach((day, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "cal-day";
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span>${DAY_NAMES[day.getDay()]}</span><b>${day.getDate()}</b>`;
      b.setAttribute("aria-label", `יום ${DAY_NAMES[day.getDay()]} ${day.getDate()}/${day.getMonth() + 1}`);
      b.addEventListener("click", () => {
        daysEl.querySelectorAll(".cal-day").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
        selDay = day; selSlot = null;
        renderSlots(i); refresh();
      });
      daysEl.appendChild(b);
      if (i === 0) b.click();
    });

    confirmBtn.addEventListener("click", () => {
      if (confirmBtn.disabled) return;
      confirmBtn.innerHTML = "✓ הדמו נקבע";
      confirmBtn.disabled = true;
      summary.textContent = `נתראה ב${summary.textContent}. זימון נשלח למייל.`;
    });
    refresh();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
