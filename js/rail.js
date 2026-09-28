/*
 * The ribbon is drawn off one number: --rail-scroll, 0 at the top of the page and 1 at the
 * bottom. Browsers that can drive a custom property from the scroll do it themselves, in CSS.
 * This is for the ones that cannot: it sets the same number, once per frame at most, and the
 * stylesheet does the rest.
 */
(function () {
    if (window.CSS && CSS.supports('animation-timeline', 'scroll(root block)')) return;

    var root = document.documentElement;
    var queued = false;

    function update() {
        queued = false;
        var max = root.scrollHeight - window.innerHeight;
        root.style.setProperty('--rail-scroll', max > 0 ? window.scrollY / max : 1);
    }

    function onScroll() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
    }

    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
})();
