/* Phylox — small progressive enhancements. The page is complete without JS. */
(function () {
  "use strict";
  var doc = document.documentElement;

  /* ---------- language ---------- */
  var META = {
    en: {
      title: "Phylox — a Layer-1 for transfers with single-block finality",
      desc: "Phylox is an independent Layer-1 written from scratch in Go: BFT consensus, 4-second blocks, single-block finality, a 0.0001 YLX base fee and half of every fee burned. Pre-launch: running on a test bench, no public network yet.",
      menu: ["Main", "Footer"]
    },
    ru: {
      title: "Phylox — блокчейн для переводов с финальностью в один блок",
      desc: "Phylox — самостоятельный блокчейн первого уровня, написанный с нуля на Go: BFT-консенсус, блок раз в 4 секунды, финальность в один блок, комиссия 0,0001 YLX, половина комиссий сжигается. До запуска: работает на тестовом стенде, публичной сети пока нет.",
      menu: ["Основная навигация", "Навигация в подвале"]
    }
  };

  function currentLang() { return doc.getAttribute("data-lang") === "ru" ? "ru" : "en"; }

  function applyLang(lang, save) {
    doc.setAttribute("data-lang", lang);
    doc.setAttribute("lang", lang);
    var m = META[lang];
    if (document.getElementById("main") && m) {
      document.title = m.title;
      var d = document.querySelector('meta[name="description"]');
      if (d) d.setAttribute("content", m.desc);
      var navs = document.querySelectorAll("nav[aria-label]");
      for (var n = 0; n < navs.length && n < m.menu.length; n++) navs[n].setAttribute("aria-label", m.menu[n]);
    }
    var btns = document.querySelectorAll(".lang button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-set") === lang ? "true" : "false");
    }
    if (save) { try { localStorage.setItem("phylox-lang", lang); } catch (e) {} }
    renderRoundState();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".lang button") : null;
    if (b) applyLang(b.getAttribute("data-set"), true);
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function () { setMenu(false); });
  }

  /* ---------- header border on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 4); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- consensus round schematic ----------
     One 4-second cycle: proposal, prevotes, precommits, decision.
     Static final state when motion is reduced or the panel is off screen. */
  var round = document.getElementById("round");
  var stateEl = document.getElementById("round-state");
  var STATES = {
    en: {
      wait: "New height. Waiting for the proposal…",
      prop: "V1 proposes block h.",
      pv: "Prevotes: {n} of 4",
      pc: "Precommits: {n} of 4",
      dec: "<b>Decided.</b> {n} of 4 precommits — block h is final."
    },
    ru: {
      wait: "Новая высота. Ждём предложение…",
      prop: "V1 предлагает блок h.",
      pv: "Предварительные голоса: {n} из 4",
      pc: "Окончательные голоса: {n} из 4",
      dec: "<b>Решено.</b> {n} из 4 окончательных голосов — блок h окончателен."
    }
  };
  var phase = { key: "dec", n: 4 };
  function renderRoundState() {
    if (!stateEl) return;
    var s = STATES[currentLang()][phase.key].replace("{n}", phase.n);
    stateEl.innerHTML = s;
  }
  function cell(step, v) { return round.querySelector('.cell[data-step="' + step + '"][data-v="' + v + '"]'); }
  function allOn(on) {
    var cs = round.querySelectorAll(".cell");
    for (var i = 0; i < cs.length; i++) cs[i].classList.toggle("on", on);
  }

  if (round) {
    allOn(true);
    if (!reduce.matches) {
      /* [time ms, action] — V3 is a little late, as a real network would be */
      var timeline = [
        [0,    function () { allOn(false); phase = { key: "wait", n: 0 }; }],
        [300,  function () { cell("pr", 1).classList.add("on"); phase = { key: "prop", n: 0 }; }],
        [550,  function () { cell("pr", 0).classList.add("on"); cell("pr", 2).classList.add("on"); }],
        [800,  function () { cell("pr", 3).classList.add("on"); }],
        [1000, function () { cell("pv", 1).classList.add("on"); phase = { key: "pv", n: 1 }; }],
        [1150, function () { cell("pv", 0).classList.add("on"); phase = { key: "pv", n: 2 }; }],
        [1300, function () { cell("pv", 2).classList.add("on"); phase = { key: "pv", n: 3 }; }],
        [1700, function () { cell("pv", 3).classList.add("on"); phase = { key: "pv", n: 4 }; }],
        [1900, function () { cell("pc", 1).classList.add("on"); phase = { key: "pc", n: 1 }; }],
        [2050, function () { cell("pc", 0).classList.add("on"); phase = { key: "pc", n: 2 }; }],
        [2200, function () { cell("pc", 2).classList.add("on"); phase = { key: "dec", n: 3 }; }],
        [2600, function () { cell("pc", 3).classList.add("on"); phase = { key: "dec", n: 4 }; }]
      ];
      var PERIOD = 4000, timers = [], running = false, cycleTimer = null;
      function runCycle() {
        timeline.forEach(function (t) {
          timers.push(setTimeout(function () { t[1](); renderRoundState(); }, t[0]));
        });
      }
      function start() {
        if (running) return; running = true;
        runCycle(); cycleTimer = setInterval(runCycle, PERIOD);
      }
      function stop() {
        running = false; clearInterval(cycleTimer);
        timers.forEach(clearTimeout); timers = [];
        allOn(true); phase = { key: "dec", n: 4 }; renderRoundState();
      }
      var inView = !("IntersectionObserver" in window);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { inView = e.isIntersecting; if (inView && !document.hidden) start(); else stop(); });
        }, { threshold: 0.2 }).observe(round);
      } else { start(); }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else if (inView) start();
      });
      reduce.addEventListener("change", function () { if (reduce.matches) stop(); });
    }
  }

  applyLang(currentLang(), false);
})();
