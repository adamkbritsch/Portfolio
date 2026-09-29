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
 * Both the width of the band and how strong the blue is come off the size of the type. A band
 * that reads as a hairline on a 38px title is a stripe on a 20px one, and the same blue that
 * sits quietly under a big letter shouts under a small one, so small type gets a narrower
 * band and a lighter blue. Nothing is written down per title: the numbers are read off the
 * page, so a new section at any size is right without being told, and a title whose size
 * moves with the window is put right again when the window stops moving.
 *
 * Nothing here needs to know what the titles say either, so a new section is an ordinary h2:
 * write it the way the others are written and it picks this up on its own. A new page only
 * needs this file; the filters come with it.
 *
 * Without JavaScript the titles are exactly what they were, white on the ribbon, because the
 * word wrappers and the copies they carry are the only thing that turns the effect on.
 */
(function () {
    "use strict";

    var TITLES = ".rail__band-text, .name__band-text, .rail__run-text";
    var STRENGTHS = ["faint", "mid", "deep"];
    var INK = "#94c9de";
    var NS = "http://www.w3.org/2000/svg";

    // The two sizes the site has now, measured off the page rather than assumed: a piece title
    // is 20px and a section title 32px. Anything between is read off the line drawn through
    // them, and anything outside stops at the nearer end - the 52px nameplate gets the widest
    // band, held to the section titles' blue rather than pushed past it.
    var SMALL = { size: 20, faint: 0.25, mid: 0.35, deep: 0.45 };
    var LARGE = { size: 32, faint: 0.45, mid: 0.55, deep: 0.7 };
    // The band is this much of the type, whatever the type is: 2px on a 32px title, and the
    // same fraction of anything else. Nothing here is a pixel count, so a title that grows
    // and shrinks with the window carries a band that grows and shrinks with it.
    var BAND_EM = 2 / 32;

    // Enough softening to take the cut edge off the band without letting it drift. Struck off
    // the band rather than in pixels, so it stays the same softness at every size.
    var BLUR_OF_BAND = 0.2;

    function between(from, to, t) {
        return from + (to - from) * t;
    }

    function scale(fontSize) {
        var t = (fontSize - SMALL.size) / (LARGE.size - SMALL.size);
        var out = { width: fontSize * BAND_EM };

        t = Math.max(0, Math.min(1, t));
        STRENGTHS.forEach(function (name) {
            out[name] = between(SMALL[name], LARGE[name], t);
        });

        return out;
    }

    function sheet() {
        var svg = document.querySelector(".ink-defs");

        if (!svg) {
            svg = document.createElementNS(NS, "svg");
            svg.setAttribute("class", "ink-defs");
            svg.setAttribute("width", "0");
            svg.setAttribute("height", "0");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");
            document.body.appendChild(svg);
        }

        return svg;
    }

    function build(svg, id, width, alpha) {
        var filter = document.createElementNS(NS, "filter");

        filter.setAttribute("id", id);
        filter.setAttribute("x", "-25%");
        filter.setAttribute("y", "-25%");
        filter.setAttribute("width", "150%");
        filter.setAttribute("height", "150%");
        filter.setAttribute("color-interpolation-filters", "sRGB");

        // Flood the letters, take the same letters shifted left away from that flood, and the
        // sliver left over is a band the width of the shift down every stroke
        filter.innerHTML =
            '<feFlood flood-color="' + INK + '" flood-opacity="' + alpha.toFixed(3) + '"/>' +
            '<feComposite in2="SourceAlpha" operator="in" result="ink"/>' +
            '<feOffset in="SourceAlpha" dx="-' + width.toFixed(3) + '" dy="0" result="shifted"/>' +
            '<feComposite in="ink" in2="shifted" operator="out" result="band"/>' +
            '<feGaussianBlur in="band" stdDeviation="' + (width * BLUR_OF_BAND).toFixed(3) + '" result="soft"/>' +
            // A blur spreads, and what it spreads past the stroke would land on the ribbon.
            // Cutting it back to the letters afterwards keeps the blue where it belongs.
            '<feComposite in="soft" in2="SourceAlpha" operator="in"/>';

        svg.appendChild(filter);
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

    function split(title) {
        var words = title.textContent.trim().split(/\s+/);
        var wrap = document.createElement("span");

        if (!words[0] || title.querySelector(".ink")) {
            return;
        }

        wrap.className = "ink";

        words.forEach(function (word, index) {
            var span = document.createElement("span");

            span.className = "ink__word";
            span.dataset.strength = strengthOf(word, index);
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

    function measure() {
        var wanted = {};
        var jobs = [];
        var svg;

        Array.prototype.forEach.call(document.querySelectorAll(TITLES), function (title) {
            var fontSize = parseFloat(window.getComputedStyle(title).fontSize);
            var step;

            if (!fontSize) {
                return;
            }

            step = scale(fontSize);
            Array.prototype.forEach.call(title.querySelectorAll(".ink__word"), function (word) {
                var strength = word.dataset.strength;
                var id = "ink-" + step.width.toFixed(3).replace(".", "-") + "-" + strength;

                wanted[id] = { width: step.width, alpha: step[strength] };
                jobs.push({ word: word, id: id });
            });
        });

        // Built fresh each time from the sizes actually on the page, so a window dragged
        // across a fluid title leaves nothing behind it
        svg = sheet();
        svg.textContent = "";
        Object.keys(wanted).forEach(function (id) {
            build(svg, id, wanted[id].width, wanted[id].alpha);
        });

        jobs.forEach(function (job) {
            job.word.style.setProperty("--ink", "url(#" + job.id + ")");
        });
    }

    function run() {
        var titles = document.querySelectorAll(TITLES);
        var settling;

        if (!titles.length) {
            return;
        }

        Array.prototype.forEach.call(titles, split);
        measure();
        document.documentElement.classList.add("has-ink");

        // A title sized in vw changes as the window does. Waiting for the window to settle
        // keeps this off the resize path itself.
        window.addEventListener("resize", function () {
            window.clearTimeout(settling);
            settling = window.setTimeout(measure, 150);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run);
    } else {
        run();
    }
})();
