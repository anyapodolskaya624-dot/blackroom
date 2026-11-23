/* Black Room. Своя статистика заходов.

   Что считаем: когда зашли, с телефона или компьютера, сколько пробыли, до какого блока
   долистали, сколько секунд смотрели каждый блок, на что нажимали, какие ответы выбрали
   в расчёте, какой это по счёту заход с этого устройства.

   Чего НЕ собираем: ни имени, ни телефона, ни IP, ни номера посетителя. На устройстве хранится
   только счётчик заходов и дата прошлого захода - они одинаковые у многих людей и не говорят,
   кто это. Поэтому это не персональные данные.

   Куда уходит: одна строчка на заход в Google Таблицу владельца сайта (через Google Форму).
   Если человек вернулся на вкладку и снова ушёл, уходит ещё одна строчка с тем же номером
   захода (номер живёт только пока открыта вкладка) - в сводке берётся последняя.

   Свои заходы не считаются: адрес blackroomteam.ru/svoi ставит на устройстве отметку «свой». */
(function () {
  const FORM = "https://docs.google.com/forms/d/e/1FAIpQLSec_WJc22hpE6HHVX7oCuObxtX1s0ypfD4525y9B2gKQgA6aA/formResponse";
  const FIELD = "entry.1261069283";
  const HOST = "blackroomteam.ru";

  let ls = null;
  try { ls = window.localStorage; ls.getItem("x"); } catch (e) { ls = null; }
  const get = k => { try { return ls ? ls.getItem(k) : null; } catch (e) { return null; } };
  const set = (k, v) => { try { if (ls) ls.setItem(k, v); } catch (e) {} };

  if (get("br_svoi") === "1") return;
  if (location.hostname !== HOST) return;
  if (navigator.webdriver) return;

  /* ---------- новый или повторный заход ----------
     Обновление страницы или возврат в течение 30 минут - тот же заход, счётчик не растёт. */
  const now0 = Date.now();
  const dayNum = t => { const d = new Date(t); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5); };
  const prevN = parseInt(get("br_n") || "0", 10) || 0;
  const prevT = parseInt(get("br_t") || "", 10);
  const sameVisit = prevN && !isNaN(prevT) && now0 - prevT < 30 * 60 * 1000;
  const visitN = sameVisit ? prevN : prevN + 1;
  const daysAgo = prevN && !sameVisit && !isNaN(prevT) ? Math.max(0, dayNum(now0) - dayNum(prevT)) : "";
  set("br_n", String(visitN));
  set("br_t", String(now0));

  /* ---------- устройство: только вид, без подробностей ---------- */
  const ua = navigator.userAgent || "";
  const os = /iPhone|iPod/.test(ua) ? "iPhone" : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "iPad"
    : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Macintosh|Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "другое";
  const kind = /iPhone|iPod/.test(ua) || (/Android/.test(ua) && /Mobile/.test(ua)) ? "телефон"
    : os === "iPad" || /Android/.test(ua) ? "планшет" : "компьютер";
  const inApp = /Telegram|TelegramBot/i.test(ua) ? "Telegram" : /YaBrowser|YaApp|YandexSearch/i.test(ua) ? "Яндекс" : "";

  /* ---------- откуда: только если браузер сам сообщил ---------- */
  function source() {
    const q = new URLSearchParams(location.search);
    const utm = (q.get("utm_source") || "").toLowerCase();
    if (utm) return ({ yandex: "Яндекс Директ", direct: "Яндекс Директ", ozon: "Ozon", avito: "Авито", wb: "Wildberries" })[utm] || utm.slice(0, 30);
    let h = "";
    try { h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) { h = ""; }
    if (!h || h === HOST || h.endsWith("." + HOST)) return inApp === "Telegram" ? "Telegram" : "";
    if (/(^|\.)yandex\.|(^|\.)ya\.ru$/.test(h)) return "Яндекс";
    if (/(^|\.)google\./.test(h)) return "Google";
    if (/(^|\.)t\.me$|telegram/.test(h)) return "Telegram";
    if (/avito/.test(h)) return "Авито";
    if (/mail\.ru$/.test(h)) return "Mail.ru";
    if (/vk\.com$|vk\.ru$/.test(h)) return "ВКонтакте";
    if (/github/.test(h)) return "";
    return h.slice(0, 40);
  }
  const src = source();

  /* ---------- блоки: сколько секунд каждый был в середине экрана ---------- */
  const SECS = [["top", "Первый экран"], ["why", "Почему мы"], ["fit", "Кому подходим"], ["services", "Что делаем"],
    ["how", "Как работаем"], ["where", "Куда возим"], ["cases", "Истории"], ["photo", "Склад"],
    ["quote", "Расчёт"], ["partners", "Партнёрам"], ["faq", "Вопросы"], ["contacts", "Контакты"]];
  const els = SECS.map(([id]) => document.getElementById(id));
  const secMs = SECS.map(() => 0);
  let maxSec = 0, curSec = -1, tick = Date.now();
  let visibleMs = 0, visSince = document.hidden ? 0 : Date.now();

  function whichSec() {
    const mid = window.innerHeight / 2;
    let on = 0;
    els.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= mid) on = i; });
    /* в самом низу страницы считаем, что дошли до последнего блока */
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) on = els.length - 1;
    return on;
  }
  function account() {
    const now = Date.now();
    if (!document.hidden && curSec >= 0) secMs[curSec] += now - tick;
    tick = now;
  }
  function onScroll() {
    account();
    curSec = whichSec();
    if (curSec > maxSec) maxSec = curSec;
  }
  curSec = whichSec(); maxSec = curSec;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---------- нажатия ---------- */
  const acts = [];
  const faq = new Set(), svc = new Set();
  let photos = 0;
  const act = s => { if (acts.length < 40) acts.push(s); };
  document.addEventListener("click", e => {
    const t = e.target.closest ? e.target.closest("a,button,summary,figure") : null;
    if (!t) return;
    const href = t.getAttribute("href") || "";
    if (t.id === "sendQuote") act("отправил расчёт в Telegram");
    else if (href === "#quote") act("кнопка «Получить расчёт»");
    else if (href.startsWith("https://t.me/BRTfulfilment")) act(t.closest("#partners") ? "Telegram: партнёрство" : "написать в Telegram");
    else if (href.startsWith("https://t.me/BRT_FF")) act("канал / видео");
    else if (href.startsWith("tel:")) act("позвонить");
    else if (href.startsWith("mailto:")) act("почта");
    else if (href.includes("yandex.ru/maps")) act("карта склада");
    else if (t.matches("button.svc")) svc.add(t.dataset.svc);
    else if (t.tagName === "SUMMARY") faq.add(t.textContent.trim().replace(/\s+/g, " ").slice(0, 40));
    else if (t.tagName === "FIGURE" && t.closest(".gal")) photos++;
  }, true);

  const SVC_NAMES = { pickup: "Забор", accept: "Приёмка", check: "Брак", mark: "Маркировка", pack: "Упаковка",
    store: "Хранение", supply: "Поставки", urgent: "Срочно" };
  const QS = [["goods", "Товар"], ["qty", "Партия"], ["from", "Забрать"], ["work", "Нужно"], ["to", "Отгрузка"], ["when", "Когда"]];
  function answers() {
    return QS.map(([n, k]) => {
      const v = [...document.querySelectorAll('#quote input[name="' + n + '"]:checked')].map(i => i.value);
      return v.length ? k + ": " + v.join(", ") : "";
    }).filter(Boolean).join("; ");
  }

  /* ---------- отправка ---------- */
  const visitId = Math.random().toString(36).slice(2, 8);
  const started = Date.now();
  let sent = 0;
  const clean = s => String(s).replace(/[|\r\n]+/g, " ").trim();

  function send() {
    account();
    if (visSince) { visibleMs += Date.now() - visSince; visSince = 0; }
    const sec = Math.round(visibleMs / 1000);
    const blocks = SECS.map(([, name], i) => [name, Math.round(secMs[i] / 1000)]).filter(([, s]) => s > 0)
      .map(([n, s]) => n + " " + s).join(", ");
    const row = [
      "v1", visitId, sent + 1, kind, os, src, visitN, daysAgo, sec, SECS[maxSec][1], blocks,
      acts.join(", "), [...svc].map(k => SVC_NAMES[k] || k).join(", "), [...faq].join(", "), photos || "",
      answers(), sameVisit ? "да" : ""
    ].map(clean).join("|");
    sent++;
    set("br_t", String(Date.now()));
    const body = new URLSearchParams();
    body.set(FIELD, row);
    try {
      if (!(navigator.sendBeacon && navigator.sendBeacon(FORM, body))) {
        fetch(FORM, { method: "POST", mode: "no-cors", body, keepalive: true }).catch(() => {});
      }
    } catch (e) {}
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { send(); }
    else { visSince = Date.now(); tick = Date.now(); }
  });
  /* на всякий случай для старых браузеров, если вкладку закрыли без события выше */
  window.addEventListener("pagehide", () => { if (!document.hidden) send(); });
})();
