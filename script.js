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

// Project gallery: a card opens its details in a dialog.
// Without JS (or without <dialog> support) the card links to the repo.
(function () {
  var dialog = document.getElementById("project-dialog");
  var store = document.getElementById("project-details");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var content = dialog.querySelector(".pd-content");
  var gallery = document.querySelector(".gallery");
  var opener = null;

  document.querySelectorAll(".gcard").forEach(function (card) {
    card.addEventListener("click", function (e) {
      var src = store.querySelector('[data-project="' + card.dataset.project + '"]');
      if (!src) return;
      e.preventDefault();
      opener = card;
      content.innerHTML = "";
      var copy = src.cloneNode(true);
      copy.querySelector(".pd-title").id = "pd-heading";
      content.appendChild(copy);
      gallery.classList.add("paused");
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });

  dialog.querySelector(".pd-close").addEventListener("click", function () { dialog.close(); });
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener("close", function () {
    gallery.classList.remove("paused");
    if (opener && opener.tabIndex !== -1) opener.focus();
  });
})();
