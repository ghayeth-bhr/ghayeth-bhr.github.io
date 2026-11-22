// Hero entrance: each word group is "detected" in turn and its
// confidence score counts up, like a model locking onto objects.
(function () {
  var boxes = document.querySelectorAll(".det");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce) return;

  boxes.forEach(function (el, i) {
    var target = parseFloat(el.dataset.conf);
    el.setAttribute("data-shown", "0.00");
    setTimeout(function () {
      el.classList.add("seen");
      var start = performance.now();
      var dur = 700;
      (function tick(now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.setAttribute("data-shown", (0.3 + (target - 0.3) * eased).toFixed(2));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }, 250 + i * 450);
  });
})();

// Carousels: one row that drifts slowly, loops seamlessly (the second set
// is a copy), and can be moved with the buttons, by dragging or by swiping.
var dialogOpen = false;
// Only focus reached with the Tab key pauses a carousel. Focus the browser
// restores when a dialog closes must not, or the row would stay frozen.
var lastTab = 0;
document.addEventListener("keydown", function (e) { if (e.key === "Tab") lastTab = performance.now(); }, true);
var carousels = [];

(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var vp = root.querySelector(".viewport");
    var sets = root.querySelectorAll(".set");
    var speed = 0.45;            // px per frame at 60 fps
    var pos = vp.scrollLeft;
    var hover = false, keyFocus = false, holdUntil = 0;
    if (reduce) root.classList.add("no-autoplay");

    function period() { return sets[1].offsetLeft - sets[0].offsetLeft; }
    function step() {
      var card = sets[0].firstElementChild;
      return card.getBoundingClientRect().width + 20;
    }
    function hold(ms) { holdUntil = performance.now() + ms; }
    function set(x) { pos = x; vp.scrollLeft = x; }

    var last = performance.now();
    function tick(now) {
      var dt = Math.min(now - last, 50); last = now;
      if (!reduce && !hover && !keyFocus && !dialogOpen && now > holdUntil) {
        var p = period();
        var x = pos + speed * dt / 16.67;
        if (x >= p) x -= p;
        set(x);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Keep our position in sync when the user (or a smooth scroll) moves it.
    vp.addEventListener("scroll", function () {
      if (Math.abs(vp.scrollLeft - pos) > 1.5) pos = vp.scrollLeft;
    }, { passive: true });

    root.querySelectorAll(".cbtn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = +btn.dataset.dir, s = step(), p = period();
        hold(5000);
        if (reduce) { vp.scrollBy({ left: dir * s, behavior: "smooth" }); return; }
        // Jump by one loop length first if we'd run off either end.
        if (dir > 0 && pos + s > p) set(pos - p);
        if (dir < 0 && pos - s < 0) set(pos + p);
        var target = (Math.round(pos / s) + dir) * s;
        vp.scrollTo({ left: target, behavior: "smooth" });
      });
    });

    // Pause while the mouse is over the row. pointermove (not pointerenter)
    // so the state is re-read after a dialog closes over it.
    vp.addEventListener("pointermove", function () { hover = true; });
    vp.addEventListener("pointerleave", function () { hover = false; });
    vp.addEventListener("wheel", function () { hold(3000); }, { passive: true });
    vp.addEventListener("touchstart", function () { hold(4000); }, { passive: true });

    // Keyboard users: pause while a card has visible focus.
    root.addEventListener("focusin", function (e) {
      keyFocus = performance.now() - lastTab < 300;
    });
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) keyFocus = false;
    });

    // Drag to scroll with a mouse; a drag doesn't count as a click.
    var startX = 0, startScroll = 0, dragging = false, moved = false;
    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startScroll = vp.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; vp.classList.add("dragging"); }
      if (moved) set(startScroll - dx);
    });
    window.addEventListener("pointerup", function () {
      if (!dragging) return;
      dragging = false;
      if (moved) hold(3000);
      setTimeout(function () { vp.classList.remove("dragging"); }, 0);
    });

    carousels.push({ resetHover: function () { hover = false; } });
  });
})();

// Details dialog: project cards show their write-up, certificate cards
// show the certificate full size. Without JS the cards are plain links.
(function () {
  var dialog = document.getElementById("project-dialog");
  var store = document.getElementById("project-details");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var content = dialog.querySelector(".pd-content");
  var opener = null;

  function open(node, card) {
    opener = card;
    content.innerHTML = "";
    content.appendChild(node);
    dialogOpen = true;
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  document.querySelectorAll(".gcard").forEach(function (card) {
    card.addEventListener("click", function (e) {
      var src = store.querySelector('[data-project="' + card.dataset.project + '"]');
      if (!src) return;
      e.preventDefault();
      var copy = src.cloneNode(true);
      copy.querySelector(".pd-title").id = "pd-heading";
      open(copy, card);
    });
  });

  document.querySelectorAll(".ccard").forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      var box = document.createElement("article");
      box.className = "pd-cert";
      var img = document.createElement("img");
      img.src = card.getAttribute("href");
      img.alt = "Certificate: " + card.querySelector(".ctitle").textContent;
      var h = document.createElement("h3");
      h.className = "pd-title"; h.id = "pd-heading";
      h.textContent = card.querySelector(".ctitle").textContent;
      var meta = document.createElement("p");
      meta.className = "stack";
      meta.textContent = card.querySelector(".cmeta").textContent;
      box.append(img, h, meta);
      if (card.dataset.verify) {
        var a = document.createElement("a");
        a.className = "repo"; a.href = card.dataset.verify;
        a.textContent = "Verify this certificate";
        a.target = "_blank"; a.rel = "noopener noreferrer";
        box.appendChild(a);
      }
      open(box, card);
    });
  });

  dialog.querySelector(".pd-close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", function () {
    dialogOpen = false;
    carousels.forEach(function (c) { c.resetHover(); });
    if (opener && opener.tabIndex !== -1) opener.focus({ preventScroll: true });
  });
})();
