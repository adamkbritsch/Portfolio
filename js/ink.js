/*
 * The misregistered edge on the white titles.
 *
 * A printing plate that lands a hair off register leaves a sliver of its own colour down one
 * side of every letter. This does the same thing in one direction, on the white titles that
 * ride the ribbon: each word gets a second copy of itself, and an SVG filter throws away all
 * of that copy but a narrow band down the right-hand side of each stroke. The letters keep
 * their shape, their position and their white; only the edges pick up the blue.
 *
 * Three strengths, dealt out a word at a time, because a plate that lands off register does
 * not land off by the same amount the whole way down a line. The strength a word gets comes
 * from the word itself, so it is the same on every load, on every machine and in every
 * screenshot - random to look at, settled underneath.
 *
 * Nothing here needs to know what the titles say, so a new section is an ordinary h2: write
 * it the way the others are written and it picks this up on its own. A new page only needs
 * this file; the filters come with it.
 *
 * Without JavaScript the titles are exactly what they were, white on the ribbon, because the
 * word wrappers and the copies they carry are the only thing that turns the effect on.
 */
(function () {
    "use strict";

    // Which band each kind of title gets. The section titles are 38px and the piece titles
    // 20px, so the piece band is struck at the same fraction of the type rather than the
    // same number of pixels, and the two read as one effect.
    var TITLES = [
        { selector: ".rail__band-text", size: "band" },
        { selector: ".name__band-text", size: "band" },
        { selector: ".rail__run-text", size: "run" }
    ];
    var STRENGTHS = ["faint", "mid", "deep"];
    var WIDTHS = { band: 2, run: 1.05 };
    var OPACITIES = { faint: 0.45, mid: 0.55, deep: 0.7 };
    var INK = "#94c9de";
    var NS = "http://www.w3.org/2000/svg";

    function defs() {
        if (document.querySelector(".ink-defs")) {
            return;
        }

        var svg = document.createElementNS(NS, "svg");

        svg.setAttribute("class", "ink-defs");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        Object.keys(WIDTHS).forEach(function (size) {
            Object.keys(OPACITIES).forEach(function (strength) {
                var filter = document.createElementNS(NS, "filter");

                filter.setAttribute("id", "ink-" + size + "-" + strength);
                filter.setAttribute("x", "-25%");
                filter.setAttribute("y", "-25%");
                filter.setAttribute("width", "150%");
                filter.setAttribute("height", "150%");
                filter.setAttribute("color-interpolation-filters", "sRGB");

                // Flood the letters, take the same letters shifted left away from that flood,
                // and the sliver left over is a band the width of the shift down every stroke
                filter.innerHTML =
                    '<feFlood flood-color="' + INK + '" flood-opacity="' + OPACITIES[strength] + '"/>' +
                    '<feComposite in2="SourceAlpha" operator="in" result="ink"/>' +
                    '<feOffset in="SourceAlpha" dx="-' + WIDTHS[size] + '" dy="0" result="shifted"/>' +
                    '<feComposite in="ink" in2="shifted" operator="out"/>';

                svg.appendChild(filter);
            });
        });

        document.body.appendChild(svg);
    }

    // The same word always draws the same strength. A plain string hash is enough to scatter
    // them: neighbouring words differ, and nothing about it changes between loads.
    function strengthOf(word, index) {
        var hash = index * 31;
        var i;

        for (i = 0; i < word.length; i += 1) {
            hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
        }

        return STRENGTHS[Math.abs(hash) % STRENGTHS.length];
    }

    function ink(title, size) {
        var words = title.textContent.trim().split(/\s+/);
        var wrap = document.createElement("span");

        if (!words[0] || title.querySelector(".ink")) {
            return;
        }

        wrap.className = "ink";

        words.forEach(function (word, index) {
            var span = document.createElement("span");

            span.className = "ink__word ink__word--" + size + " ink__word--" + strengthOf(word, index);
            // The copy is drawn from this rather than from the text node, so the filter has a
            // shape to work on without a second text node in the line to space around
            span.setAttribute("data-word", word);
            span.textContent = word;

            if (index) {
                wrap.appendChild(document.createTextNode(" "));
            }

            wrap.appendChild(span);
        });

        title.textContent = "";
        title.appendChild(wrap);
    }

    function run() {
        var found = 0;

        TITLES.forEach(function (kind) {
            Array.prototype.forEach.call(document.querySelectorAll(kind.selector), function (title) {
                ink(title, kind.size);
                found += 1;
            });
        });

        if (found) {
            defs();
            document.documentElement.classList.add("has-ink");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run);
    } else {
        run();
    }
})();
