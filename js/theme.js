/*
 * Light and dark. The page is the poster's cream by default and the toggle in the header
 * switches it; the choice is remembered, and until one is made the operating system decides.
 *
 * This runs render-blocking in the head on purpose: the attribute has to be on <html> before
 * the first paint, or the page flashes cream on its way to dark. It is the only script on
 * the site, so it stays small and swallows its own errors - a browser with storage turned
 * off still gets a working toggle, it just forgets the choice on the next page.
 */
(function () {
    var root = document.documentElement;

    function stored() {
        try {
            return localStorage.getItem("theme");
        } catch (e) {
            return null;
        }
    }

    function apply(theme) {
        root.setAttribute("data-theme", theme);

        var button = document.querySelector(".theme-toggle");
        if (button) {
            button.setAttribute("aria-pressed", String(theme === "dark"));
        }
    }

    var preferred = stored();
    if (!preferred) {
        preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    apply(preferred);

    // The button does not exist yet when this runs, so its state is set again once it does
    document.addEventListener("DOMContentLoaded", function () {
        apply(root.getAttribute("data-theme"));
    });

    document.addEventListener("click", function (event) {
        var button = event.target.closest(".theme-toggle");
        if (!button) {
            return;
        }

        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        apply(next);

        try {
            localStorage.setItem("theme", next);
        } catch (e) {
            // storage is off; the toggle still works, it just will not be remembered
        }
    });
})();
