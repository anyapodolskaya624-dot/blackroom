/* Black Room. Цен на сайте нет: прайс отправляем тем, кто написал. */

/* ---------- заявка на расчёт: ответы складываются в сообщение для Telegram ---------- */
const $ = id => document.getElementById(id);
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

/* ---------- свечение: жёлтое и серое пятно чередуют стороны от блока к блоку, как страницы прайса ---------- */
function placeGlows() {
  const page = document.querySelector(".page").getBoundingClientRect();
  document.querySelectorAll(".glow[data-sec]").forEach(g => {
    const s = document.getElementById(g.dataset.sec);
    if (!s) { g.style.display = "none"; return; }
    const r = s.getBoundingClientRect();
    g.style.top = Math.round(r.top - page.top + r.height * (+g.dataset.pos || 0.5) - g.offsetHeight / 2) + "px";
  });
}
window.addEventListener("load", placeGlows);
window.addEventListener("resize", placeGlows);
document.querySelectorAll("details").forEach(d => d.addEventListener("toggle", placeGlows));
placeGlows();
