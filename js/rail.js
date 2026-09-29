/*
 * How far each run of the ribbon drains.
 *
 * Every straight run has the colour drawn out of its middle so the bends read as the bright
 * part of the ribbon, and that was one number for all of them. It is not one thing to ask of a
 * 50px drop between two corners and of a 1,175px lane down the side of the page: the short one
 * is all shoulder and has nowhere to go, so a deep drain leaves it flat grey, while the long
 * one can drift a long way down and back and never look like it did anything abrupt.
 *
 * So each run is measured and told how far to go:
 *
 *   how long it is    the one that matters. Read on a log scale, because the difference
 *                     between 50px and 150px is a change of kind and the difference between
 *                     1,000px and 1,100px is not. Every run still drains - the shortest is
 *                     held to a floor - but a long one goes about twice as far. Nothing
 *                     drains past the single figure every run used to get.
 *
 *   how thick it is   a thin run shows the drain sooner than a thick one at the same depth,
 *                     so a piece's run is eased off a little and the band through my name,
 *                     the thickest thing on the page, is allowed a little more.
 *
 *   which one it is   a few per cent either way, drawn from the run itself, so that two runs
 *                     of the same length are not the same to look at. The ribbon is one piece
 *                     of ink laid down in one pass, and ink does not sit at one density.
 *
 * The shoulder - the part of each end left at full strength so it meets its corner bright -
 * was a percentage, which meant a long run kept 164px of full colour and a short one 7px. It
 * is now the same fraction of the ribbon's own thickness wherever it is, turned into the
 * percentage that comes to on that run.
 *
 * Without JavaScript every run falls back to the single depth and shoulder it had before.
 */
(function () {
    "use strict";

    // Where a run is measured, what it is measured along, and which property it reads. A
    // pseudo-element cannot carry a property of its own, so its owner carries it and it
    // inherits; the last section's column owns two runs and keeps them apart by name.
    var RUNS = [
        { find: ".rail__band", along: "width" },
        { find: ".rail__run", along: "width" },
        { find: ".rail__drop", along: "height" },
        { find: ".name__band", along: "width" },
        { find: "main .section > .wrap", pseudo: "::after", along: "height" },
        { find: "main .section > .wrap", pseudo: "::before", along: "width", name: "--soften-foot" },
        { find: ".project", pseudo: "::after", along: "height" },
        { find: "main .section > .wrap > :not(h2):not(.project)", pseudo: "::after", along: "height" }
    ];

    var SHORT = 48;          // px: a drop between two corners, the least the ribbon ever runs
    var LONG = 1200;         // px: the lane down the side of the tallest section
    var SHALLOW = 0.06;      // how far a run that short drains
    var DEEP = 0.17;         // how far a run that long drains, and the greyest any run goes
    var TITLE = 42;          // px: the ribbon's thickness at a section title, the middle case
    var CLEAR = 2;           // ribbon-thicknesses of full colour kept either side of a bend
    var WOBBLE = 0.06;       // how much a run may differ from another of its own length

    function clamp(low, high, n) {
        return Math.max(low, Math.min(high, n));
    }

    // A run's own few per cent, taken from its size and where it sits so that it is the same
    // on every load rather than different on every one
    function wobbleOf(seed) {
        var hash = Math.round(seed * 97) | 0;

        hash = ((hash << 5) - hash + 0x9e37) | 0;
        hash = (hash ^ (hash >>> 13)) | 0;

        return ((Math.abs(hash) % 1000) / 1000 * 2 - 1) * WOBBLE;
    }

    function depthFor(along, across, seed) {
        var reach = Math.log(clamp(SHORT, LONG, along) / SHORT) / Math.log(LONG / SHORT);
        var thin = clamp(0.85, 1.05, 0.85 + 0.15 * (across / TITLE));

        return clamp(0.04, 0.19, (SHALLOW + (DEEP - SHALLOW) * reach) * thin * (1 + wobbleOf(seed)));
    }

    /*
     * A bend, and the ribbon either side of it, is never drained at all. That is a distance and
     * not a proportion: two thicknesses of the ribbon itself, which is the same amount of clear
     * colour into every corner on the page whether the run leaving it is 50px or 1,200px. As a
     * share of a long run that comes to less than the 14% one always kept, so the floor holds;
     * on a short run it is most of the run, and the little that is left in the middle is the
     * least the fade ever does anyway. A run with two ends has two of these.
     */
    function shoulderFor(along, across) {
        return clamp(14, 45, 100 * CLEAR * across / along);
    }

    /*
     * How long a box is down one axis. A pseudo-element held between two offsets has no height
     * of its own to report - Gecko says so plainly, and answers `auto` - so where that happens
     * it is worked out from the offsets instead: the room its containing block gives it, less
     * what is held back at each end. The containing block is the owner's padding box, which is
     * what clientWidth and clientHeight measure.
     */
    function span(owner, style, axis) {
        var across = axis === "width";
        var size = parseFloat(across ? style.width : style.height);
        var start = parseFloat(across ? style.left : style.top);
        var end = parseFloat(across ? style.right : style.bottom);
        var room = across ? owner.clientWidth : owner.clientHeight;

        if (!isNaN(size)) {
            return size;
        }

        if (isNaN(start) || isNaN(end)) {
            return 0;
        }

        return room - start - end;
    }

    function measure() {
        RUNS.forEach(function (kind) {
            var name = kind.name || "--soften";

            Array.prototype.forEach.call(document.querySelectorAll(kind.find), function (owner) {
                var style = window.getComputedStyle(owner, kind.pseudo || null);
                var along;
                var across;

                if (kind.pseudo && (style.content === "none" || style.display === "none")) {
                    return;
                }

                along = span(owner, style, kind.along);
                across = span(owner, style, kind.along === "width" ? "height" : "width");

                // Below the rail's breakpoint there is no ribbon to measure
                if (!along || !across || style.display === "none") {
                    return;
                }

                owner.style.setProperty(name, depthFor(along, across, along + across).toFixed(3));
                owner.style.setProperty(name + "-shoulder", shoulderFor(along, across).toFixed(2) + "%");
            });
        });
    }

    function run() {
        var settling;

        measure();

        // Every one of these lengths comes off the width of the page
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
