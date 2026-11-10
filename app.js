/* Black Room. Цен на сайте нет: прайс отправляем тем, кто написал. */
const $ = id => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- заявка на расчёт: ответы складываются в сообщение для Telegram ---------- */
const QS = ["goods", "qty", "from", "work", "to", "when"];
const pick = name => [...document.querySelectorAll('input[name="' + name + '"]:checked')].map(i => i.value);
let text = "";
function build() {
  const rows = [
    ["Товар", pick("goods")],
    ["Партия", pick("qty").map(v => v + " ед.")],
    ["Забрать", pick("from")],
    ["Нужно", pick("work")],
    ["Отгрузка", pick("to")],
    ["Когда", pick("when")]
  ].filter(([, v]) => v.length);
  text = "Здравствуйте! Хочу получить расчёт." + (rows.length ? "\n" + rows.map(([k, v]) => k + ": " + v.join(", ")).join("\n") : "");
  $("preview").textContent = text;
  $("sendQuote").href = "https://t.me/BRTfulfilment?text=" + encodeURIComponent(text);
  /* сколько вопросов уже отвечено – полоска и отметки у номеров */
  let done = 0;
  document.querySelectorAll("#quote .q").forEach((q, i) => {
    const ok = pick(QS[i]).length > 0;
    q.classList.toggle("done", ok);
    if (ok) done++;
  });
  $("progBar").style.width = Math.round(done / QS.length * 100) + "%";
  $("progTxt").textContent = done + " из " + QS.length;
}
document.querySelectorAll("#quote input").forEach(i => i.addEventListener("change", build));
build();
/* Ссылка с текстом открывает чат с готовым сообщением в свежих версиях Telegram.
   На всякий случай заявка ещё и копируется: её можно просто вставить в чат. */
$("sendQuote").addEventListener("click", () => {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => {
    $("copied").textContent = "Заявка скопирована – если она не появилась в чате, просто вставьте её.";
  }).catch(() => {});
});

/* ---------- свечение и кубы по краям: встают рядом со своими блоками ---------- */
function placeDeco() {
  const page = document.querySelector(".page").getBoundingClientRect();
  document.querySelectorAll(".glow[data-sec], .cube[data-sec]").forEach(g => {
    const s = document.getElementById(g.dataset.sec);
    if (!s) { g.style.display = "none"; return; }
    const r = s.getBoundingClientRect();
    g.style.top = Math.round(r.top - page.top + r.height * (+g.dataset.pos || 0.5) - g.getBoundingClientRect().height / 2) + "px";
  });
}
window.addEventListener("load", placeDeco);
window.addEventListener("resize", placeDeco);
document.querySelectorAll("details").forEach(d => d.addEventListener("toggle", placeDeco));
placeDeco();

/* ---------- появление блоков и счётчики цифр ---------- */
function countUp(el) {
  const to = +el.dataset.to, suf = el.dataset.suf || "", t0 = performance.now(), dur = 1100;
  const fmt = n => Math.round(n).toLocaleString("ru-RU") + suf;
  const step = t => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(to * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
if ("IntersectionObserver" in window && !reduce) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains("rv"));
    el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 70 + "ms";
    el.classList.add("in");
    el.querySelectorAll("[data-to]").forEach(countUp);
    io.unobserve(el);
  }), { threshold: 0.12 });
  document.querySelectorAll(".rv").forEach(el => io.observe(el));
} else {
  document.querySelectorAll(".rv").forEach(el => el.classList.add("in"));
}

/* ---------- схема складов: наведение на склад подсвечивает его маршрут ---------- */
function hl(n, on) {
  document.querySelectorAll('[data-n="' + n + '"]').forEach(e => e.classList.toggle("hl", on));
}
document.querySelectorAll('.chips span[data-n], .map .nd').forEach(el => {
  el.addEventListener("mouseenter", () => hl(el.dataset.n, true));
  el.addEventListener("mouseleave", () => hl(el.dataset.n, false));
});
/* на телефоне наведения нет – маршрут подсвечивается касанием */
let tapped = null;
document.querySelectorAll('.chips span[data-n]').forEach(el => el.addEventListener("click", () => {
  if (tapped) hl(tapped, false);
  tapped = tapped === el.dataset.n ? null : el.dataset.n;
  if (tapped) hl(tapped, true);
}));

/* ---------- фото крупно ---------- */
const figs = [...document.querySelectorAll(".gal figure")];
const lb = $("lb"), lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption");
let cur = 0;
function show(i) {
  cur = (i + figs.length) % figs.length;
  const f = figs[cur];
  lbImg.src = f.querySelector("img").src;
  lbImg.alt = f.querySelector("img").alt;
  lbCap.textContent = f.querySelector("figcaption").textContent;
  lb.hidden = false;
}
figs.forEach((f, i) => f.addEventListener("click", () => show(i)));
lb.querySelector(".lb-x").addEventListener("click", () => lb.hidden = true);
lb.querySelector(".lb-p").addEventListener("click", e => { e.stopPropagation(); show(cur - 1); });
lb.querySelector(".lb-n").addEventListener("click", e => { e.stopPropagation(); show(cur + 1); });
lb.addEventListener("click", e => { if (e.target === lb) lb.hidden = true; });
document.addEventListener("keydown", e => {
  if (lb.hidden) return;
  if (e.key === "Escape") lb.hidden = true;
  if (e.key === "ArrowLeft") show(cur - 1);
  if (e.key === "ArrowRight") show(cur + 1);
});

/* ---------- шапка: тень при прокрутке и активный пункт меню ---------- */
const bar = document.querySelector(".topbar");
const links = [...document.querySelectorAll(".menu a")];
const secs = links.map(a => document.querySelector(a.getAttribute("href")));
const mbar = $("bar"), heroBtns = document.querySelector(".hero .btns");
function onScroll() {
  bar.classList.toggle("scrolled", scrollY > 10);
  /* нижняя панель на телефоне – только когда кнопки первого экрана ушли из вида */
  if (mbar && heroBtns) mbar.classList.toggle("show", heroBtns.getBoundingClientRect().bottom < 0);
  let on = -1;
  secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) on = i; });
  links.forEach((a, i) => a.classList.toggle("on", i === on));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- карусель фото: стрелки, точки, перелистывание по кругу и тихое автолистание ---------- */
(function () {
  const gal = $("gal"), dotsBox = $("galDots");
  if (!gal) return;
  const items = [...gal.children];
  const dots = items.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Фото " + (i + 1));
    b.addEventListener("click", () => { go(i); pause(9000); });
    dotsBox.appendChild(b);
    return b;
  });
  const maxLeft = () => gal.scrollWidth - gal.clientWidth;
  const pos = i => items[i].offsetLeft - items[0].offsetLeft;
  function current() {
    if (gal.scrollLeft >= maxLeft() - 4) return items.length - 1;
    let best = 0;
    items.forEach((_, i) => { if (Math.abs(pos(i) - gal.scrollLeft) < Math.abs(pos(best) - gal.scrollLeft)) best = i; });
    return best;
  }
  function go(i) {
    const n = items.length;
    i = (i + n) % n;
    gal.scrollTo({ left: Math.min(pos(i), maxLeft()), behavior: reduce ? "auto" : "smooth" });
  }
  /* после последнего видимого фото – снова к первому */
  function step(d) {
    const c = current();
    if (d > 0 && gal.scrollLeft >= maxLeft() - 4) go(0);
    else if (d < 0 && gal.scrollLeft <= 4) go(items.length - 1);
    else go(c + d);
  }
  let raf = 0;
  gal.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const c = current(); dots.forEach((d, i) => d.classList.toggle("on", i === c)); });
  }, { passive: true });
  dots[0].classList.add("on");
  document.querySelector(".car-btn.prev").addEventListener("click", () => { step(-1); pause(9000); });
  document.querySelector(".car-btn.next").addEventListener("click", () => { step(1); pause(9000); });

  /* автолистание: только когда карусель на экране, не под мышкой и не после касания */
  let visible = false, hold = 0, hover = false;
  const pause = ms => { hold = Date.now() + ms; };
  gal.parentElement.addEventListener("mouseenter", () => hover = true);
  gal.parentElement.addEventListener("mouseleave", () => hover = false);
  gal.addEventListener("touchstart", () => pause(10000), { passive: true });
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(gal);
  if (!reduce) setInterval(() => {
    if (visible && !hover && Date.now() > hold && $("lb").hidden && !document.hidden) step(1);
  }, 4000);
})();

/* ---------- схема складов на телефоне: рамка по рисунку, чтобы схема стояла по центру ----------
   На ноутбуке рамка прежняя, её не трогаем. */
(function () {
  const svg = document.querySelector(".map");
  if (!svg) return;
  const DESK = "0 0 640 450";
  const mq = window.matchMedia("(max-width:759px)");
  function fit() {
    if (!mq.matches) { svg.setAttribute("viewBox", DESK); return; }
    svg.setAttribute("viewBox", DESK);
    const b = svg.getBBox(), pad = 12;
    svg.setAttribute("viewBox", [b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2].map(v => Math.round(v)).join(" "));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("load", fit);
  if (mq.addEventListener) mq.addEventListener("change", fit);
  fit();
})();
