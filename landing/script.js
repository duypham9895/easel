/* =============================================
   CUSTOM CURSOR
============================================= */
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});

function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

/* =============================================
   HAMBURGER MENU
============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen.toString());
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/* =============================================
   INTERSECTION OBSERVER — SCROLL ANIMATIONS
============================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (entry.target.closest('#score')) {
        setTimeout(animateBars, 400);
      }
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =============================================
   ANIMATED CYCLE WHEEL (CANVAS)
============================================= */
function drawCycleWheel() {
  const canvas = document.getElementById('cycleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 12;
  const innerR = outerR * 0.52;

  const isVi = document.documentElement.lang === 'vi';

  const phases = isVi
    ? [
        { label: 'Hành kinh',  days: 5,  color: '#c97c84', textColor: '#fff' },
        { label: 'Nang trứng', days: 8,  color: '#f0a844', textColor: '#fff' },
        { label: 'Rụng trứng', days: 3,  color: '#a8d4b0', textColor: '#fff' },
        { label: 'Hoàng thể',  days: 12, color: '#9b7fc0', textColor: '#fff' },
      ]
    : [
        { label: 'Menstrual',  days: 5,  color: '#c97c84', textColor: '#fff' },
        { label: 'Follicular', days: 8,  color: '#f0a844', textColor: '#fff' },
        { label: 'Ovulation',  days: 3,  color: '#a8d4b0', textColor: '#fff' },
        { label: 'Luteal',     days: 12, color: '#9b7fc0', textColor: '#fff' },
      ];

  const fontSize = isVi ? '600 10px DM Sans, sans-serif' : '600 11px DM Sans, sans-serif';
  const total = phases.reduce((s, p) => s + p.days, 0);
  let rotation = 0;

  function draw(rot) {
    ctx.clearRect(0, 0, w, h);
    let angle = -Math.PI / 2 + rot;

    phases.forEach(phase => {
      const sweep = (phase.days / total) * Math.PI * 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = phase.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, angle, angle + sweep);
      ctx.closePath();
      ctx.strokeStyle = '#fdf8f5';
      ctx.lineWidth = 3;
      ctx.stroke();

      const midAngle = angle + sweep / 2;
      const labelR = (outerR + innerR) / 2;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = phase.textColor;
      ctx.font = fontSize;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(phase.label, 0, 0);
      ctx.restore();

      angle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#f5e6e8';
    ctx.fill();
  }

  function animate() {
    rotation += 0.003;
    draw(rotation);
    requestAnimationFrame(animate);
  }
  animate();
}

drawCycleWheel();

/* =============================================
   SCORE RING (CANVAS)
============================================= */
function drawScoreRing() {
  const canvas = document.getElementById('scoreCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 16;
  const score = 87;
  const progress = score / 100;

  let currentProgress = 0;
  const target = progress;

  function draw(p) {
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 12;
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + p * Math.PI * 2;

    const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    gradient.addColorStop(0, '#a8d4b0');
    gradient.addColorStop(1, '#9b7fc0');

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  const scoreSection = document.getElementById('score');
  const scoreObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      let start = null;
      function animateScore(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const duration = 1500;
        currentProgress = Math.min(target, target * (elapsed / duration));
        draw(currentProgress);
        if (currentProgress < target) requestAnimationFrame(animateScore);
      }
      requestAnimationFrame(animateScore);
      scoreObserver.disconnect();
    }
  }, { threshold: 0.3 });

  scoreObserver.observe(scoreSection);
  draw(0);
}

drawScoreRing();

/* =============================================
   SCORE BARS ANIMATION
============================================= */
function animateBars() {
  document.querySelectorAll('.score-bar-fill').forEach(bar => {
    const pct = bar.getAttribute('data-fill');
    bar.style.width = pct + '%';
  });
}

/* =============================================
   SMOOTH SCROLL
============================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* =============================================
   NAV SCROLL STYLE
============================================= */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 40
    ? '0 4px 32px rgba(42, 31, 45, 0.08)'
    : 'none';
}, { passive: true });
