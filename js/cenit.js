/* Sitio público de Cenit Comunicaciones: navegación, videos demo, entradas al hacer scroll y formulario. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Navegación: cambia a barra blanca al bajar ----------
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Menú en celular ----------
  var btn = document.getElementById('menuBtn'), menu = document.getElementById('menu-movil');
  function cerrarMenu() { btn.setAttribute('aria-expanded', 'false'); menu.hidden = true; nav.classList.remove('abierto'); }
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var abrir = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(abrir)); menu.hidden = !abrir; nav.classList.toggle('abierto', abrir);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) cerrarMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { cerrarMenu(); btn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1040 && !menu.hidden) cerrarMenu(); });
  }

  // ---------- Plataforma en video: pestañas + reproducción solo cuando se ve ----------
  var demo = document.getElementById('demo');
  if (demo) {
    var tabs = Array.prototype.slice.call(demo.querySelectorAll('.step'));
    var devs = Array.prototype.slice.call(demo.querySelectorAll('.device'));
    var mdesc = document.getElementById('mdesc'), play = document.getElementById('demoPlay');
    var actual = 0, enVista = false, tocado = false, pausado = reduce, raf = 0;

    function video(i) { return devs[i] && devs[i].querySelector('video'); }
    function barra(i) { return tabs[i].querySelector('.prog i'); }
    function pintarBarra() {
      var v = video(actual);
      if (v && v.duration) barra(actual).style.transform = 'scaleX(' + Math.min(1, v.currentTime / v.duration).toFixed(4) + ')';
      raf = v && !v.paused ? requestAnimationFrame(pintarBarra) : 0;
    }
    function reproducir() {
      var v = video(actual); if (!v) return;
      if (pausado || !enVista) { v.pause(); return; }
      v.preload = 'auto';
      var p = v.play(); if (p && p.catch) p.catch(function () { });
      if (!raf) raf = requestAnimationFrame(pintarBarra);
    }
    function mostrar(i, desdeUsuario) {
      var v0 = video(actual); if (v0) v0.pause();
      actual = i;
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; if (j !== i) barra(j).style.transform = 'scaleX(0)'; });
      devs.forEach(function (d, j) { d.classList.toggle('on', j === i); });
      document.getElementById('stage').setAttribute('aria-labelledby', tabs[i].id);
      var v = video(i); if (v) { v.currentTime = 0; v.loop = tocado; }
      // el siguiente video empieza a cargarse en segundo plano
      var sig = video((i + 1) % devs.length); if (sig && sig.preload === 'none') sig.preload = 'metadata';
      var lis = tabs[i].querySelectorAll('li'), html = '<p>' + tabs[i].querySelector('.d').textContent + '</p><ul>';
      lis.forEach(function (li) { html += '<li>' + li.textContent + '</li>'; });
      mdesc.innerHTML = html + '</ul>';
      if (desdeUsuario && window.innerWidth <= 960) tabs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
      reproducir();
    }
    devs.forEach(function (d, j) {
      var v = d.querySelector('video'); if (!v) return;
      // al terminar pasa al siguiente, salvo que la persona ya haya elegido uno (entonces se repite)
      v.addEventListener('ended', function () { if (j === actual && !tocado) mostrar((actual + 1) % devs.length); });
      v.addEventListener('play', function () { if (!raf) raf = requestAnimationFrame(pintarBarra); });
    });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { tocado = true; mostrar(i, true); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); tabs[n].focus(); tabs[n].click(); }
      });
    });
    function estadoPlay() { play.classList.toggle('pausado', pausado); play.setAttribute('aria-label', pausado ? 'Reproducir video' : 'Pausar video'); }
    play.addEventListener('click', function () { pausado = !pausado; estadoPlay(); reproducir(); });
    estadoPlay();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { enVista = es[0].isIntersecting; reproducir(); }, { threshold: .35 }).observe(document.getElementById('stage'));
    } else { enVista = true; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { var v = video(actual); if (v) v.pause(); } else reproducir(); });
    mostrar(0);
  }

  // ---------- Entradas al hacer scroll: cada bloque una vez, escalonado dentro de su sección ----------
  var rv = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var grupos = new Map();
  rv.forEach(function (el) {
    var sec = el.closest('section, footer') || document.body, n = grupos.get(sec) || 0;
    el.style.setProperty('--d', String(Math.min(n, 5))); grupos.set(sec, n + 1);
  });
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px 10% 0px', threshold: 0 });
    rv.forEach(function (el) { io.observe(el); });
    function alFinal() { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { rv.forEach(function (el) { el.classList.add('in'); }); removeEventListener('scroll', alFinal); } }
    addEventListener('scroll', alFinal, { passive: true });
    setTimeout(function () { rv.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }); }, 60);
  }

  // ---------- Botones que llevan al formulario: llenan "Me interesa" y el mensaje ----------
  var f = document.getElementById('form');
  var sel = document.getElementById('f-interes'), msg = document.getElementById('f-msg');
  document.querySelectorAll('a[data-interes]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (sel) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === a.dataset.interes) sel.selectedIndex = i; }
      if (msg && a.dataset.mensaje && (!msg.value.trim() || msg.dataset.auto === '1')) { msg.value = a.dataset.mensaje + ' '; msg.dataset.auto = '1'; if (f) f.classList.add('prefill'); }
      setTimeout(function () { var n = document.getElementById('f-nombre'); if (n) n.focus({ preventScroll: true }); }, 500);
    });
  });
  if (msg) msg.addEventListener('input', function () { msg.dataset.auto = '0'; });

  // ---------- Formulario: validación rápida antes de enviarlo ----------
  if (f) f.addEventListener('submit', function (e) {
    var n = document.getElementById('f-nombre'), c = document.getElementById('f-correo');
    if (!n.value.trim()) { e.preventDefault(); n.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(c.value.trim())) { e.preventDefault(); c.focus(); return; }
    var b = f.querySelector('button[type=submit]'); if (b) { b.disabled = true; b.textContent = 'Enviando…'; }
  });
})();
