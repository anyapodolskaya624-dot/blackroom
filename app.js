/* Свечение: жёлтое и серое пятно чередуют стороны от блока к блоку, как страницы прайса */
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
placeGlows();
