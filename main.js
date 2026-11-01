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
  const h1 = document.querySelector(".hero h1[data-split]");
  if (h1) {
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
    words.forEach((w, i) => { w.style.animationDelay = `${i * 60}ms`; });
    const wordsEnd = words.length * 60 + 300;
    requestAnimationFrame(() => h1.classList.add("go"));
    document.querySelectorAll(".hero-fade").forEach((el, i) => {
      el.style.animationDelay = `${Math.min(wordsEnd + i * 80, 820)}ms`;
      requestAnimationFrame(() => el.classList.add("go"));
    });
  }

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
      meta: "שיחה נכנסת · יום ו׳ 21:47",
      tags: ["תור נקבע", "סונכרן ל-Monday"],
      lines: [
        ["bot", "ערב טוב, הגעת למוסך אורן. אני העוזרת הדיגיטלית, איך אפשר לעזור?"],
        ["caller", "היי, תשמעי, נדלקה לי נורה של המנוע באמצע הדרך, זה משהו רציני?"],
        ["bot", "לא נעים, אבל טוב שהתקשרת. הנורה דולקת קבוע או מהבהבת?"],
        ["caller", "קבוע. האוטו נוסע סבבה, רק שזה מלחיץ אותי."],
        ["bot", "אם היא קבועה והאוטו נוסע רגיל, זה בדרך כלל לא דחוף. אבל כדאי לעשות בדיקת מחשב. יש לי מקום ביום ראשון ב-08:30, מתאים?"],
        ["caller", "יאללה, מעולה. שמים על השם רוני."],
        ["event", "✓ תור נקבע: יום א׳ 08:30 · בדיקת מחשב"],
        ["bot", "סגור רוני, שלחתי לך SMS עם האישור והכתובת. נסיעה טובה!"]
      ]
    },
    clinic: {
      title: "מרפאת שיניים ד״ר לוי, חיפה",
      meta: "שיחה נכנסת · שבת 10:12",
      tags: ["ליד חם", "סונכרן ל-Powerlink"],
      lines: [
        ["bot", "שבת שלום, הגעת למרפאת ד״ר לוי. המרפאה סגורה כרגע, אבל אני כאן לעזור."],
        ["caller", "שבת שלום. כואבת לי שן כבר מאתמול בלילה, וואלה אני לא ישן."],
        ["bot", "מצטערת לשמוע. הכאב חד או יותר עמום? ויש נפיחות?"],
        ["caller", "חד, כשאני שותה משהו קר. אין נפיחות."],
        ["bot", "הבנתי. אני מסמנת את זה כפנייה דחופה. רוצה שאקבע לך תור ראשון ביום ראשון, ב-08:00?"],
        ["caller", "כן, בבקשה, הכי מוקדם שיש."],
        ["event", "✓ פנייה דחופה הועברה לצוות · תור א׳ 08:00"],
        ["bot", "נקבע. בינתיים, אפשר לקחת משכך כאבים רגיל ולהימנע מקר. רפואה שלמה!"]
      ]
    },
    realestate: {
      title: "קבוצת נדל״ן אופק, תל אביב",
      meta: "שיחה נכנסת · חוה״מ 19:30",
      tags: ["ליד מסווג", "סונכרן ל-HubSpot"],
      lines: [
        ["bot", "חג שמח, הגעת לאופק נדל״ן. במה אפשר לעזור?"],
        ["caller", "ראיתי מודעה על 4 חדרים בפלורנטין, זה עוד רלוונטי?"],
        ["bot", "כן, הדירה עדיין זמינה. רק כדי לדייק, מחפשים לקנות או לשכור?"],
        ["caller", "לקנות. יש לנו משכנתא באישור עקרוני."],
        ["bot", "מצוין. מה התקציב בערך, ומתי תרצו לראות את הדירה?"],
        ["caller", "עד 3.2 מיליון. אפשר אחרי החג, בערב?"],
        ["event", "✓ ליד חם · תקציב 3.2M ₪ · סיור ביום ה׳ 18:00"],
        ["bot", "קבעתי לכם סיור ביום חמישי ב-18:00 עם אבי מהצוות. הוא יחזור אליכם מחר לאישור."]
      ]
    }
  };

  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>';

  document.querySelectorAll("[data-player]").forEach((root) => {
    const tabs = root.querySelectorAll(".player-tab");
    const playBtn = root.querySelector(".play-btn");
    const wave = root.querySelector(".waveform");
    const transcript = root.querySelector(".transcript");
    const titleEl = root.querySelector("[data-title]");
    const metaEl = root.querySelector("[data-meta]");
    const timeEl = root.querySelector(".player-time");
    const statusEl = root.querySelector("[data-status]");
    const tagsEl = root.querySelector("[data-tags]");
    const BARS = 48;
    const LINE_MS = 2300;

    wave.innerHTML = "";
    const seed = [...Array(BARS)].map((_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75);
    const bars = seed.map((h) => {
      const b = document.createElement("i");
      b.style.height = `${Math.round(h * 40)}%`;
      wave.appendChild(b);
      return b;
    });

    let key = root.dataset.scenario || "garage";
    let idx = 0, timer = null, raf = null, playing = false, startedAt = 0, elapsedBefore = 0;

    const total = () => SCENARIOS[key].lines.length * LINE_MS;
    const fmt = (ms) => {
      const s = Math.floor(ms / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    };

    const setStatus = (txt) => { if (statusEl) statusEl.textContent = txt; };

    const reset = () => {
      stop();
      idx = 0; elapsedBefore = 0;
      const sc = SCENARIOS[key];
      titleEl.textContent = sc.title;
      metaEl.textContent = sc.meta;
      tagsEl.innerHTML = sc.tags.map((t, i) => `<span class="tag${i ? " purple" : ""}">${t}</span>`).join("");
      transcript.innerHTML = '<p class="transcript-empty">לחצו Play כדי לשמוע איך הבוט עונה בעברית מדוברת</p>';
      bars.forEach((b, i) => { b.className = ""; b.style.height = `${Math.round(seed[i] * 40)}%`; });
      timeEl.textContent = `00:00 / ${fmt(total())}`;
      playBtn.innerHTML = ICON_PLAY;
      playBtn.setAttribute("aria-label", "השמע שיחה לדוגמה");
      setStatus("מוכן");
    };

    const addLine = () => {
      const sc = SCENARIOS[key];
      if (idx >= sc.lines.length) { finish(); return; }
      if (idx === 0) transcript.innerHTML = "";
      const [who, text] = sc.lines[idx];
      const el = document.createElement("div");
      el.className = `msg ${who}`;
      const label = who === "bot" ? "AfterHours AI" : who === "caller" ? "לקוח" : "";
      el.innerHTML = `${label ? `<span class="who">${label}</span>` : ""}<div class="bubble"></div>`;
      el.querySelector(".bubble").textContent = text;
      transcript.appendChild(el);
      transcript.scrollTop = transcript.scrollHeight;
      idx++;
      timer = setTimeout(addLine, LINE_MS);
    };

    const animate = () => {
      const elapsed = elapsedBefore + (performance.now() - startedAt);
      const p = Math.min(elapsed / total(), 1);
      const doneCount = Math.floor(p * BARS);
      const t = performance.now() / 120;
      bars.forEach((b, i) => {
        if (i < doneCount) { b.className = "done"; b.style.height = `${Math.round(seed[i] * 70)}%`; }
        else if (i < doneCount + 4) {
          b.className = "active";
          b.style.height = `${Math.round(30 + Math.abs(Math.sin(t + i)) * 70)}%`;
        } else { b.className = ""; b.style.height = `${Math.round(seed[i] * 40)}%`; }
      });
      timeEl.textContent = `${fmt(elapsed)} / ${fmt(total())}`;
      if (playing) raf = requestAnimationFrame(animate);
    };

    const play = () => {
      if (idx >= SCENARIOS[key].lines.length) reset();
      playing = true;
      root.classList.add("playing");
      startedAt = performance.now();
      playBtn.innerHTML = ICON_PAUSE;
      playBtn.setAttribute("aria-label", "השהה");
      setStatus("שיחה חיה");
      addLine();
      raf = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (playing) elapsedBefore += performance.now() - startedAt;
      playing = false;
      root.classList.remove("playing");
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };

    const pause = () => {
      stop();
      playBtn.innerHTML = ICON_PLAY;
      playBtn.setAttribute("aria-label", "המשך השמעה");
      setStatus("מושהה");
    };

    const finish = () => {
      stop();
      bars.forEach((b, i) => { b.className = "done"; b.style.height = `${Math.round(seed[i] * 70)}%`; });
      timeEl.textContent = `${fmt(total())} / ${fmt(total())}`;
      playBtn.innerHTML = ICON_REPLAY;
      playBtn.setAttribute("aria-label", "השמע שוב");
      setStatus("השיחה הסתיימה");
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

  /* ---------- Pillars: pinned scroll ---------- */
  initPillars();

  function initPillars() {
    const root = document.querySelector("[data-pillars]");
    if (!root) return;
    const pillars = [...root.querySelectorAll("[data-pillar]")];
    const headline = root.querySelector("[data-pillars-center]");
    const hint = root.querySelector("[data-pillars-hint]");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const from = [
      { x: 0, y: -48 },
      { x: 56, y: 0 },
      { x: -56, y: 0 },
      { x: 40, y: 48 },
      { x: -40, y: 48 },
    ];
    const drift = [
      { x: 0, y: -20 },
      { x: 20, y: 0 },
      { x: -20, y: 0 },
      { x: 14, y: 18 },
      { x: -14, y: 18 },
    ];
    const windows = [
      [0.05, 0.20],
      [0.20, 0.35],
      [0.35, 0.50],
      [0.50, 0.65],
      [0.65, 0.80],
    ];

    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const span = (p, a, b) => {
      if (p <= a) return 0;
      if (p >= b) return 1;
      return easeOut((p - a) / (b - a));
    };

    const setPillar = (el, show, ox, oy, dx, dy) => {
      el.style.setProperty("--show", show.toFixed(4));
      el.style.setProperty("--ox", `${ox}px`);
      el.style.setProperty("--oy", `${oy}px`);
      el.style.setProperty("--drift-x", `${dx}px`);
      el.style.setProperty("--drift-y", `${dy}px`);
    };

    const pinProgress = () => {
      const total = root.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      return clamp(-root.getBoundingClientRect().top / total, 0, 1);
    };

    const renderPin = () => {
      const p = pinProgress();
      const breath = p < 0.5 ? 1 + p * 0.04 : 1.02 - (p - 0.5) * 0.04;
      if (headline) headline.style.setProperty("--scale", breath.toFixed(4));
      if (hint) hint.classList.toggle("is-gone", p > 0.18);
      const hold = span(p, 0.8, 1);
      pillars.forEach((el, i) => {
        const [a, b] = windows[i];
        const show = span(p, a, b);
        const ox = from[i].x * (1 - show);
        const oy = from[i].y * (1 - show);
        setPillar(el, show, ox, oy, drift[i].x * hold, drift[i].y * hold);
      });
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (mq.matches) {
          pillars.forEach((el, i) => setPillar(el, 1, 0, 0, drift[i].x, drift[i].y));
          if (headline) headline.style.setProperty("--scale", "1");
          if (hint) hint.classList.remove("is-gone");
        } else {
          renderPin();
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    onScroll();
  }
})();
