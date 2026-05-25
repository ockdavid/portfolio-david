(function () {
  "use strict";

  var data    = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ================================================================
     NAV — sticky + mobile menu
     ================================================================ */
  function initNav() {
    var nav    = $(".nav");
    var burger = $(".nav-burger");
    var mobile = $(".nav-mobile");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && mobile) {
      burger.addEventListener("click", function () {
        var isOpen = burger.getAttribute("aria-expanded") === "true";
        var next   = !isOpen;
        burger.setAttribute("aria-expanded", String(next));
        mobile.setAttribute("aria-hidden", String(!next));
        burger.classList.toggle("is-open", next);
        mobile.classList.toggle("is-open", next);
      });

      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          burger.setAttribute("aria-expanded", "false");
          mobile.setAttribute("aria-hidden", "true");
          burger.classList.remove("is-open");
          mobile.classList.remove("is-open");
        });
      });
    }
  }

  /* ================================================================
     SMOOTH SCROLL — anchor links
     ================================================================ */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navEl = $(".nav");
      var navH  = navEl ? navEl.offsetHeight : 80;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ================================================================
     MOUSE-REACTIVE GRADIENT — hero
     ================================================================ */
  function initMouseGradient() {
    var gradient = $("[data-mouse-gradient]");
    if (!gradient || !fineHover) return;

    var rafId = null;
    var mx = 50, my = 50;

    window.addEventListener("mousemove", function (e) {
      mx = (e.clientX / window.innerWidth)  * 100;
      my = (e.clientY / window.innerHeight) * 100;
      if (!rafId) {
        rafId = requestAnimationFrame(function () {
          document.documentElement.style.setProperty("--mx", mx + "%");
          document.documentElement.style.setProperty("--my", my + "%");
          rafId = null;
        });
      }
    });
  }

  /* ================================================================
     HERO ANIMATION — GSAP stagger on load
     ================================================================ */
  function initHeroAnim() {
    if (!window.gsap) return;
    var tl = gsap.timeline({ delay: 0.1, defaults: { ease: "expo.out" } });
    tl.from(".hero-kicker",       { opacity: 0, y: 16, duration: 0.9 })
      .from(".hero-title",        { opacity: 0, y: 70, duration: 1.1 }, "-=0.55")
      .from(".hero-sub",          { opacity: 0, y: 20, duration: 0.85 }, "-=0.55")
      .from(".hero-actions",      { opacity: 0, y: 18, duration: 0.8 }, "-=0.45")
      .from(".hero-scroll-hint",  { opacity: 0, duration: 0.6 }, "-=0.2");
  }

  /* ================================================================
     REVEALS — IntersectionObserver with stagger + 6s safety net
     ================================================================ */
  function initReveals() {
    var els = $$(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      visible.forEach(function (e, i) {
        var delay = i * 70;
        setTimeout(function () {
          e.target.classList.add("is-visible");
        }, delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -2% 0px" });

    els.forEach(function (el) { io.observe(el); });

    /* 6-second mandatory safety net — reveals anything still hidden in view */
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.1) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ================================================================
     COUNT UP — animated numbers
     ================================================================ */
  function initCountUp() {
    var counters = $$("[data-count-to]");
    if (!counters.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);

        var target  = parseInt(e.target.getAttribute("data-count-to"), 10);
        var started = Date.now();
        var dur     = 1400;

        function tick() {
          var elapsed  = Date.now() - started;
          var progress = Math.min(elapsed / dur, 1);
          var eased    = 1 - Math.pow(1 - progress, 3);
          e.target.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(tick);
          else e.target.textContent = target;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { io.observe(el); });
  }

  /* ================================================================
     STACK CARDS — cursor-following glow
     ================================================================ */
  function initStackCards() {
    if (!fineHover) return;

    $$(".stack-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x    = ((e.clientX - rect.left) / rect.width)  * 100;
        var y    = ((e.clientY - rect.top)  / rect.height) * 100;
        var glow = card.querySelector(".stack-card-glow");
        if (glow) {
          glow.style.background =
            "radial-gradient(circle 180px at " + x + "% " + y + "%, rgba(0,212,255,0.15) 0%, transparent 70%)";
        }
      });
      card.addEventListener("mouseleave", function () {
        var glow = card.querySelector(".stack-card-glow");
        if (glow) glow.style.background = "";
      });
    });
  }

  /* ================================================================
     PROJECTS ACCORDION — expand / collapse rows
     ================================================================ */
  function initProjects() {
    var rows = $$("[data-project]");

    rows.forEach(function (row) {
      var toggle = $(".project-toggle", row);
      var body   = $(".project-row-body", row);
      var header = $(".project-row-header", row);
      if (!toggle || !body || !header) return;

      header.addEventListener("click", function () {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";

        /* Close all siblings first */
        rows.forEach(function (r) {
          if (r === row) return;
          var t = $(".project-toggle", r);
          var b = $(".project-row-body", r);
          if (t) t.setAttribute("aria-expanded", "false");
          if (b) b.hidden = true;
          r.classList.remove("is-open");
        });

        /* Toggle this row */
        var next = !isOpen;
        toggle.setAttribute("aria-expanded", String(next));
        body.hidden = !next;
        row.classList.toggle("is-open", next);
      });
    });
  }

  /* ================================================================
     CONTACT FORM — visual feedback (replace action with Formspree)
     ================================================================ */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var btn  = $("button[type='submit']", form);
      var text = btn ? $(".btn-text", btn) : null;

      if (btn) {
        btn.disabled = true;
        if (text) text.textContent = "Enviando…";
      }

      /* Visual success simulation.
         To send real emails: set form action="https://formspree.io/f/YOUR_ID"
         and remove e.preventDefault() above, or use fetch() against Formspree API. */
      setTimeout(function () {
        if (btn) {
          btn.style.background = "#10b981";
          if (text) text.textContent = "✓ Mensaje enviado";
        }
        form.reset();

        setTimeout(function () {
          if (btn) {
            btn.disabled = false;
            btn.style.background = "";
            if (text) text.textContent = "Enviar mensaje";
          }
        }, 4000);
      }, 1200);
    });
  }

  /* ================================================================
     BOOT
     ================================================================ */
  function boot() {
    safe(initNav,          "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initMouseGradient,"initMouseGradient");
    safe(initReveals,      "initReveals");
    safe(initCountUp,      "initCountUp");
    safe(initStackCards,   "initStackCards");
    safe(initProjects,     "initProjects");
    safe(initContactForm,  "initContactForm");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroAnim, "initHeroAnim");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
