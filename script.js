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
