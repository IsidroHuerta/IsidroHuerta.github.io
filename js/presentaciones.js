/* Visor de presentaciones gratuitas: flechas, teclado, deslizar con el dedo, miniaturas y pantalla completa.
   Sin JavaScript las láminas se ven una debajo de otra. Si la presentación tiene PDF, se muestra con pdf.js. */
(function () {
  'use strict';
  var visor = document.getElementById('visor'), pista = document.getElementById('pista'); if (!visor) return;
  var minis = Array.prototype.slice.call(document.querySelectorAll('#minis button'));
  var cuenta = document.getElementById('cuenta'), avance = document.getElementById('avance');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paginas = [], actual = 0;

  function ir(i) {
    if (!paginas.length) return;
    actual = Math.max(0, Math.min(paginas.length - 1, i));
    paginas.forEach(function (p, j) { p.classList.toggle('on', j === actual); p.setAttribute('aria-hidden', j === actual ? 'false' : 'true'); });
    cuenta.textContent = (actual + 1) + ' / ' + paginas.length;
    avance.style.transform = 'scaleX(' + ((actual + 1) / paginas.length).toFixed(4) + ')';
    minis.forEach(function (m, j) { m.setAttribute('aria-current', String(j === actual)); });
    // la tira de miniaturas se desplaza sola; la página no se mueve
    var m = minis[actual], tira = m && m.parentElement;
    if (m && tira) {
      var izq = m.offsetLeft - tira.offsetLeft, der = izq + m.offsetWidth;
      if (izq < tira.scrollLeft || der > tira.scrollLeft + tira.clientWidth)
        tira.scrollTo({ left: Math.max(0, izq - (tira.clientWidth - m.offsetWidth) / 2), behavior: reduce ? 'auto' : 'smooth' });
    }
    ['ant', 'ant2'].forEach(function (id) { document.getElementById(id).disabled = actual === 0; });
    ['sig', 'sig2'].forEach(function (id) { document.getElementById(id).disabled = actual === paginas.length - 1; });
    if (history.replaceState) history.replaceState(null, '', '#' + (actual + 1));
  }
  function iniciar() {
    paginas = Array.prototype.slice.call(pista.children);
    var h = parseInt(location.hash.slice(1), 10);
    ir(isNaN(h) ? 0 : h - 1);
  }

  ['ant', 'ant2'].forEach(function (id) { document.getElementById(id).addEventListener('click', function () { ir(actual - 1); }); });
  ['sig', 'sig2'].forEach(function (id) { document.getElementById(id).addEventListener('click', function () { ir(actual + 1); }); });
  minis.forEach(function (m, j) { m.addEventListener('click', function () { ir(j); }); });
  document.addEventListener('keydown', function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && e.target === visor)) { e.preventDefault(); ir(actual + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(actual - 1); }
    if (e.key === 'Home' && e.target === visor) ir(0);
    if (e.key === 'End' && e.target === visor) ir(paginas.length - 1);
  });
  // Deslizar con el dedo: solo cuenta un gesto claramente horizontal
  var x0 = null, y0 = 0;
  visor.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
  visor.addEventListener('pointerup', function (e) {
    if (x0 === null) return; var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(actual + (dx < 0 ? 1 : -1));
  });
  visor.addEventListener('pointercancel', function () { x0 = null; });
  // Toque en la mitad derecha/izquierda avanza o regresa (como un libro)
  visor.addEventListener('click', function (e) {
    if (e.target.closest('button')) return;
    var r = visor.getBoundingClientRect(); ir(actual + (e.clientX - r.left > r.width / 2 ? 1 : -1));
  });

  var full = document.getElementById('completa');
  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) full.hidden = true;
  full.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else (visor.requestFullscreen || visor.webkitRequestFullscreen).call(visor);
  });

  var comp = document.getElementById('compartir');
  if (comp) comp.addEventListener('click', function () {
    var d = { title: comp.dataset.titulo, url: comp.dataset.url };
    if (navigator.share) { navigator.share(d).catch(function () { }); return; }
    navigator.clipboard.writeText(d.url).then(function () { comp.textContent = 'Enlace copiado'; setTimeout(function () { comp.textContent = 'Compartir'; }, 1800); });
  });

  // PDF real: reemplaza las láminas armadas por las páginas del archivo
  var pdf = pista.dataset.pdf;
  if (pdf && window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.min.js';
    pdfjsLib.getDocument(pdf).promise.then(function (doc) {
      pista.innerHTML = ''; var cola = Promise.resolve();
      for (var n = 1; n <= doc.numPages; n++) (function (n) {
        var cont = document.createElement('div'); cont.className = 'pdf-pag'; var cv = document.createElement('canvas'); cont.appendChild(cv); pista.appendChild(cont);
        cola = cola.then(function () { return doc.getPage(n); }).then(function (pg) {
          var vp = pg.getViewport({ scale: 1 }), k = Math.min(2, (visor.clientWidth * (window.devicePixelRatio || 1)) / vp.width);
          var v2 = pg.getViewport({ scale: k }); cv.width = v2.width; cv.height = v2.height;
          return pg.render({ canvasContext: cv.getContext('2d'), viewport: v2 }).promise;
        });
      })(n);
      document.getElementById('minis').hidden = true;
      iniciar();
    }).catch(iniciar);
  } else iniciar();
})();
