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
