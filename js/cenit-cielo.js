/* El cielo de Cenit: noche azul, una montaña cuya cima apunta al cenit y una estrella dorada justo encima.
   Las estrellas giran muy despacio alrededor del cenit (como en una foto de larga exposición), titilan,
   y de vez en cuando cruza una fugaz. Se usa en la portada y en el inicio de sesión.

   Uso: CenitCielo.montar(elemento, { parallax: true })
   Rendimiento: tres lienzos; solo el de estrellas se anima, y se detiene fuera de pantalla o en otra pestaña.
   Movimiento reducido: el cielo se pinta una vez y se queda quieto. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function lienzo(padre, clase) {
    var c = document.createElement('canvas');
    c.className = clase; c.setAttribute('aria-hidden', 'true');
    padre.appendChild(c); return c;
  }

  function preparar(c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  // Geometría compartida: dónde está la cima y dónde el cenit (justo encima de la cima)
  function geometria(w, h, o) {
    var cel = w < 720;
    var sx = w * (o.cimaX != null ? o.cimaX : .5);
    var sy = h * (o.cimaY != null ? o.cimaY : (cel ? .6 : .665));
    var base = h * (cel ? .86 : .93);
    return { cel: cel, sx: sx, sy: sy, base: base, zx: sx, zy: h * (o.cenitY != null ? o.cenitY : (cel ? .14 : .13)),
             ancho: Math.max(220, w * (cel ? .55 : .24)) };
  }

  /* ---------- Cielo (fondo quieto) ---------- */
  function pintarCielo(c, o) {
    var p = preparar(c), ctx = p.ctx, w = p.w, h = p.h, g = geometria(w, h, o);
    var f = ctx.createLinearGradient(0, 0, 0, h);
    f.addColorStop(0, '#070a14'); f.addColorStop(.35, '#111933'); f.addColorStop(.62, '#1f2a52'); f.addColorStop(.8, '#2d3967'); f.addColorStop(1, '#121a30');
    ctx.fillStyle = f; ctx.fillRect(0, 0, w, h);
    // resplandor frío alrededor del cenit
    var z = ctx.createRadialGradient(g.zx, g.zy, 0, g.zx, g.zy, Math.max(w, h) * .45);
    z.addColorStop(0, 'rgba(120,140,210,.16)'); z.addColorStop(1, 'rgba(120,140,210,0)');
    ctx.fillStyle = z; ctx.fillRect(0, 0, w, h);
    // luz cálida y baja detrás de la cima: el dorado de la marca, apenas
    var d = ctx.createRadialGradient(g.sx, g.sy + h * .04, 0, g.sx, g.sy, Math.max(w * .55, 420));
    d.addColorStop(0, 'rgba(201,169,97,.30)'); d.addColorStop(.45, 'rgba(201,169,97,.08)'); d.addColorStop(1, 'rgba(201,169,97,0)');
    ctx.fillStyle = d; ctx.fillRect(0, 0, w, h);
  }

  /* ---------- Montañas (quietas; se desplazan con el scroll) ---------- */
  function perfil(w, base, amp, rough, seed, pico) {
    var r = rng(seed), off = [r() * 100, r() * 100, r() * 100, r() * 100], pts = [];
    for (var x = -4; x <= w + 4; x += 4) {
      var t = x / w, y = 0;
      y += Math.sin(t * 3.1 + off[0]) * .5;
      y += Math.sin(t * 7.7 + off[1]) * .26 * rough;
      y += Math.sin(t * 19.3 + off[2]) * .1 * rough;
      y += Math.abs(Math.sin(t * 41 + off[3])) * .05 * rough;
      var alto = base - y * amp;
      if (pico) {
        var k = Math.max(0, 1 - Math.abs(x - pico.x) / pico.ancho);
        var forma = Math.pow(k, 1.35);
        // aristas: más quebrado cerca de la cima
        var quiebre = (Math.sin(x * .09 + off[0]) * .5 + Math.sin(x * .23 + off[1]) * .25) * 9 * k;
        alto = Math.min(alto, pico.base - forma * (pico.base - pico.y) + quiebre * (1 - Math.pow(k, 6)));
      }
      pts.push([x, alto]);
    }
    return pts;
  }
  function trazar(ctx, pts, h) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], h);
    for (var i = 0; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[pts.length - 1][0], h); ctx.closePath();
  }
  function bruma(ctx, w, y0, y1, a) {
    var m = ctx.createLinearGradient(0, y0, 0, y1);
    m.addColorStop(0, 'rgba(120,135,190,0)'); m.addColorStop(.6, 'rgba(120,135,190,' + a + ')'); m.addColorStop(1, 'rgba(120,135,190,0)');
    ctx.fillStyle = m; ctx.fillRect(0, y0, w, y1 - y0);
  }

  function pintarMontes(c, o) {
    var p = preparar(c), ctx = p.ctx, w = p.w, h = p.h, g = geometria(w, h, o), s = Math.max(.7, h / 900);
    ctx.clearRect(0, 0, w, h);

    // cordillera lejana, con dos hombros a los lados de la cima
    trazar(ctx, perfil(w, h * .76, 54 * s, 1, 11, { x: g.sx - g.ancho * 1.15, y: h * .69, ancho: g.ancho * .9, base: h * .8 }), h);
    ctx.fillStyle = '#232c55'; ctx.fill();
    trazar(ctx, perfil(w, h * .78, 50 * s, 1.1, 17, { x: g.sx + g.ancho * 1.25, y: h * .71, ancho: g.ancho * .85, base: h * .82 }), h);
    ctx.fillStyle = '#28325e'; ctx.fill();
    bruma(ctx, w, h * .64, h * .84, .2);

    // la montaña del cenit
    var pico = { x: g.sx, y: g.sy, ancho: g.ancho, base: g.base };
    var pts = perfil(w, h * .86, 36 * s, 1.1, 23, pico);
    trazar(ctx, pts, h);
    var sombra = ctx.createLinearGradient(0, g.sy, 0, g.base);
    sombra.addColorStop(0, '#2e3a6c'); sombra.addColorStop(1, '#1a2242');
    ctx.fillStyle = sombra; ctx.fill();

    ctx.save(); trazar(ctx, pts, h); ctx.clip();
    // cara iluminada (derecha): se desvanece hacia la base, sin "rayos"
    var luz = ctx.createLinearGradient(0, g.sy, 0, g.base);
    luz.addColorStop(0, 'rgba(118,132,190,.95)'); luz.addColorStop(.55, 'rgba(78,92,150,.55)'); luz.addColorStop(1, 'rgba(60,72,128,0)');
    ctx.fillStyle = luz;
    ctx.beginPath(); ctx.moveTo(g.sx, g.sy - 2); ctx.lineTo(g.sx + g.ancho * 1.05, g.base); ctx.lineTo(g.sx + g.ancho * .12, g.base); ctx.closePath(); ctx.fill();
    // nieve en la cima, con borde inferior quebrado
    var nieve = (g.base - g.sy) * .26, r = rng(5);
    ctx.beginPath(); ctx.moveTo(g.sx - g.ancho * .5, g.sy - 40); ctx.lineTo(g.sx + g.ancho * .5, g.sy - 40);
    for (var i = 0; i <= 18; i++) {
      var t = i / 18, x = g.sx + g.ancho * (.4 - t * .8);
      var caida = nieve * Math.max(0, 1 - Math.abs(t - .5) * 2.1) * (.45 + r() * .7);
      ctx.lineTo(x, g.sy + caida);
    }
    ctx.closePath();
    var nv = ctx.createLinearGradient(g.sx - g.ancho * .25, 0, g.sx + g.ancho * .25, 0);
    nv.addColorStop(0, 'rgba(176,188,222,.55)'); nv.addColorStop(.5, 'rgba(226,231,245,.92)'); nv.addColorStop(1, 'rgba(244,238,222,.96)');
    ctx.fillStyle = nv; ctx.fill();
    ctx.restore();

    // filo dorado: la cima recibe la luz del cenit
    ctx.save();
    var filo = ctx.createRadialGradient(g.sx, g.sy, 0, g.sx, g.sy, g.ancho * .55);
    filo.addColorStop(0, 'rgba(236,210,146,1)'); filo.addColorStop(1, 'rgba(236,210,146,0)');
    ctx.strokeStyle = filo; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.beginPath(); var primero = true;
    for (var j = 0; j < pts.length; j++) {
      if (Math.abs(pts[j][0] - g.sx) > g.ancho * .55) continue;
      if (primero) { ctx.moveTo(pts[j][0], pts[j][1]); primero = false; } else ctx.lineTo(pts[j][0], pts[j][1]);
    }
    ctx.stroke(); ctx.restore();

    bruma(ctx, w, h * .8, h * .95, .16);
    // cerros cercanos y primer plano
    trazar(ctx, perfil(w, h * .93, 40 * s, 1.5, 37), h); ctx.fillStyle = '#141a31'; ctx.fill();
    trazar(ctx, perfil(w, h * 1.0, 26 * s, 1.8, 53), h); ctx.fillStyle = '#0d1224'; ctx.fill();
  }

  /* ---------- Estrellas (animadas) ---------- */
  function estrellas(c, o) {
    var ctx, w, h, g, lista = [], fugaz = null, prox = 0, raf = 0, t0 = 0, visible = true;
    var VUELTA = 14 * 60 * 1000;           // una vuelta completa en 14 minutos: se nota, no distrae

    function crear() {
      var p = preparar(c); ctx = p.ctx; w = p.w; h = p.h; g = geometria(w, h, o);
      var r = rng(42), R = Math.hypot(Math.max(g.zx, w - g.zx), Math.max(g.zy, h - g.zy));
      var n = Math.min(2200, Math.round(Math.PI * R * R / (g.cel ? 1500 : 1700)));
      lista = [];
      for (var i = 0; i < n; i++) {
        var radio = Math.sqrt(r()) * R, ang = r() * 6.2832, k = r();
        lista.push({ r: radio, a: ang,
          s: k < .035 ? 2 : k < .16 ? 1.4 : k < .5 ? 1 : .75,
          b: .45 + r() * .55, f: .5 + r() * 2.2, p: r() * 6.28,
          col: r() < .06 ? '232,206,140' : (r() < .3 ? '200,214,255' : '240,242,250') });
      }
    }

    function cenit(t) {
      var pulso = .5 + .5 * Math.sin(t * .0016);
      var rad = (g.cel ? 26 : 34) * (1 + pulso * .18);
      var halo = ctx.createRadialGradient(g.zx, g.zy, 0, g.zx, g.zy, rad);
      halo.addColorStop(0, 'rgba(240,216,150,.95)'); halo.addColorStop(.18, 'rgba(225,195,120,.45)'); halo.addColorStop(1, 'rgba(201,169,97,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(g.zx, g.zy, rad, 0, 6.2832); ctx.fill();
      // destello de cuatro puntas
      var L = (g.cel ? 16 : 22) * (1 + pulso * .12);
      ctx.fillStyle = 'rgba(250,236,200,.9)';
      ctx.beginPath();
      ctx.moveTo(g.zx, g.zy - L); ctx.quadraticCurveTo(g.zx, g.zy, g.zx + L * .9, g.zy);
      ctx.quadraticCurveTo(g.zx, g.zy, g.zx, g.zy + L); ctx.quadraticCurveTo(g.zx, g.zy, g.zx - L * .9, g.zy);
      ctx.quadraticCurveTo(g.zx, g.zy, g.zx, g.zy - L); ctx.fill();
      ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.arc(g.zx, g.zy, 2.2, 0, 6.2832); ctx.fill();
    }

    function pintar(t) {
      ctx.clearRect(0, 0, w, h);
      var giro = (t / VUELTA) * 6.2832, limite = g.sy + (h - g.sy) * .2;
      for (var i = 0; i < lista.length; i++) {
        var e = lista[i], an = e.a + giro;
        var x = g.zx + Math.cos(an) * e.r, y = g.zy + Math.sin(an) * e.r;
        if (x < -2 || x > w + 2 || y < -2 || y > limite) continue;
        // se apagan hacia el horizonte (más bruma) y muy cerca del cenit (su luz las opaca)
        var horiz = 1 - Math.max(0, (y - h * .42) / (limite - h * .42));
        var cerca = Math.min(1, e.r / 60);
        var a = e.b * (.6 + .4 * Math.sin(t * .001 * e.f + e.p)) * horiz * cerca;
        if (a < .03) continue;
        ctx.globalAlpha = a; ctx.fillStyle = 'rgb(' + e.col + ')';
        if (e.s < 1.2) ctx.fillRect(x - e.s * .6, y - e.s * .6, e.s * 1.25, e.s * 1.25);
        else { ctx.beginPath(); ctx.arc(x, y, e.s, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      if (fugaz) {
        var k = (t - fugaz.t) / fugaz.d;
        if (k >= 1) fugaz = null;
        else {
          var hx = fugaz.x + fugaz.dx * k, hy = fugaz.y + fugaz.dy * k, al = Math.sin(k * Math.PI);
          var cola = ctx.createLinearGradient(hx, hy, hx - fugaz.dx * .22, hy - fugaz.dy * .22);
          cola.addColorStop(0, 'rgba(250,244,230,' + al + ')'); cola.addColorStop(1, 'rgba(250,244,230,0)');
          ctx.strokeStyle = cola; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - fugaz.dx * .22, hy - fugaz.dy * .22); ctx.stroke();
        }
      } else if (t > prox) {
        var izq = Math.random() < .5;
        fugaz = { t: t, d: 750 + Math.random() * 450, x: w * (izq ? .08 + Math.random() * .3 : .55 + Math.random() * .3), y: h * (.04 + Math.random() * .2),
                  dx: w * (.16 + Math.random() * .12) * (izq ? 1 : -1), dy: h * (.07 + Math.random() * .08) };
        prox = t + 3500 + Math.random() * 6000;
      }
      cenit(t);
    }

    function bucle(ahora) { pintar(ahora - t0); raf = visible && !document.hidden ? requestAnimationFrame(bucle) : 0; }
    function arrancar() { if (!raf && !reduce) raf = requestAnimationFrame(bucle); }

    crear();
    if (reduce) pintar(0);
    else {
      t0 = performance.now() - Math.random() * VUELTA; prox = 0; arrancar();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) arrancar(); }).observe(c);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) arrancar(); });
    }
    return function () { crear(); if (reduce) pintar(0); };
  }

  function montar(el, opciones) {
    if (!el) return;
    var o = opciones || {};
    var cielo = lienzo(el, 'cielo-fondo'), cap = lienzo(el, 'cielo-estrellas'), montes = lienzo(el, 'cielo-montes');
    pintarCielo(cielo, o); pintarMontes(montes, o);
    var rehacer = estrellas(cap, o);
    var rt, ancho = window.innerWidth;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        // en el celular la barra del navegador cambia la altura al hacer scroll: solo se repinta si cambia el ancho
        if (Math.abs(window.innerWidth - ancho) < 2 && o.soloAncho) return;
        ancho = window.innerWidth; pintarCielo(cielo, o); pintarMontes(montes, o); rehacer();
      }, 160);
    });
    // Profundidad al hacer scroll: el cielo se queda atrás y la montaña acompaña un poco (solo transform)
    if (o.parallax && !reduce) {
      var pend = false;
      var mover = function () {
        pend = false; var y = Math.min(window.scrollY, el.offsetHeight);
        cielo.style.transform = cap.style.transform = 'translate3d(0,' + (y * .35).toFixed(1) + 'px,0)';
        montes.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0)';
      };
      window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
    }
  }

  window.CenitCielo = { montar: montar };
})();
