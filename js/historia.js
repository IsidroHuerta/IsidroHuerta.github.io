/* Historia 9:16: avanza sola cada 5 s cuando se ve, toque a la derecha/izquierda para cambiar,
   mantener presionado para pausar. Con "reducir movimiento" no avanza sola. */
(function () {
  'use strict';
  var h = document.getElementById('historia'); if (!h) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cuadros = Array.prototype.slice.call(h.querySelectorAll('.h-cuadro'));
  var barras = Array.prototype.slice.call(h.querySelectorAll('.h-barras i'));
  var pausaBtn = document.getElementById('hPausa');
  var DUR = 5000, actual = 0, inicio = 0, transcurrido = 0, raf = 0, enVista = false, pausado = reduce, sostenido = false;

  function pintar(k) { barras.forEach(function (b, j) { b.style.transform = 'scaleX(' + (j < actual ? 1 : j > actual ? 0 : k) + ')'; }); }
  function ir(i) {
    actual = (i + cuadros.length) % cuadros.length; transcurrido = 0; inicio = performance.now();
    cuadros.forEach(function (c, j) { c.classList.toggle('on', j === actual); c.setAttribute('aria-hidden', String(j !== actual)); });
    h.classList.toggle('claro', !!cuadros[actual].dataset.claro);   // encabezado oscuro sobre láminas claras
    pintar(0);
  }
  function corriendo() { return enVista && !pausado && !sostenido && !document.hidden; }
  function bucle(t) {
    raf = 0; if (!corriendo()) return;
    var k = Math.min(1, (transcurrido + (t - inicio)) / DUR); pintar(k);
    if (k >= 1) ir(actual + 1);
    raf = requestAnimationFrame(bucle);
  }
  function seguir() { if (corriendo() && !raf) { inicio = performance.now(); raf = requestAnimationFrame(bucle); } }
  function detener() { if (raf) { cancelAnimationFrame(raf); raf = 0; transcurrido += performance.now() - inicio; } }
  function estado() { pausaBtn.classList.toggle('pausado', pausado); pausaBtn.setAttribute('aria-label', pausado ? 'Reproducir historia' : 'Pausar historia'); }

  document.getElementById('hSig').addEventListener('click', function () { ir(actual + 1); seguir(); });
  document.getElementById('hAnt').addEventListener('click', function () { ir(actual - 1); seguir(); });
  pausaBtn.addEventListener('click', function () { pausado = !pausado; estado(); if (pausado) detener(); else seguir(); });
  h.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); seguir(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); seguir(); }
  });
  // Mantener presionado pausa, como en las historias de Instagram
  var t0 = 0;
  h.addEventListener('pointerdown', function (e) { if (e.target.closest('.h-cta, .h-pausa')) return; t0 = Date.now(); sostenido = true; detener(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { h.addEventListener(ev, function () { if (sostenido) { sostenido = false; seguir(); } }); });
  h.addEventListener('click', function (e) { if (Date.now() - t0 > 350 && e.target.closest('.h-zona')) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);

  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { enVista = es[0].isIntersecting; if (enVista) seguir(); else detener(); }, { threshold: .5 }).observe(h);
  else enVista = true;
  document.addEventListener('visibilitychange', function () { if (document.hidden) detener(); else seguir(); });
  estado(); ir(0); seguir();
})();
