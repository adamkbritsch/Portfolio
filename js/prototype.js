/*
 * The click-through prototype.
 *
 * Every screen is one picture; the taps are buttons laid over it in percentages, so they
 * stay on the right control at any size. The screen graph is a JSON block inside the markup
 * rather than in here, so the prototype is data and this file is the machinery.
 *
 * Without JavaScript the block hides itself and the still screens above it carry the page,
 * which is why the markup starts hidden and this script reveals it.
 */
(function () {
    var root = document.querySelector("[data-proto]");

    if (!root) {
        return;
    }

    var data;

    try {
        data = JSON.parse(root.querySelector(".proto__map").textContent);
    } catch (e) {
        return;
    }

    var shot = root.querySelector(".proto__shot");
    var spots = root.querySelector(".proto__spots");
    var where = root.querySelector(".proto__where");
    var backButton = root.querySelector(".proto__back");
    var resetButton = root.querySelector(".proto__reset");
    var hintButton = root.querySelector(".proto__hint");
    var trail = [];

    function screenOf(name) {
        return data.screens[name];
    }

    function taps(name) {
        var screen = screenOf(name);
        var list = (screen.spots || []).slice();

        if (screen.tabs) {
            list = list.concat(data.tabs);
        }

        return list.filter(function (spot) {
            return spot.to !== name;
        });
    }

    function show(name, remember) {
        var screen = screenOf(name);

        if (!screen) {
            return;
        }

        if (remember) {
            trail.push(root.dataset.at);
        }

        root.dataset.at = name;
        shot.src = data.path + name + ".webp";
        shot.alt = screen.alt;
        where.textContent = screen.label;
        backButton.disabled = trail.length === 0;

        spots.textContent = "";
        taps(name).forEach(function (spot) {
            var button = document.createElement("button");

            button.type = "button";
            button.className = "proto__spot";
            button.style.left = spot.x + "%";
            button.style.top = spot.y + "%";
            button.style.width = spot.w + "%";
            button.style.height = spot.h + "%";
            button.setAttribute("aria-label", spot.label + " — go to " + screenOf(spot.to).label);
            button.addEventListener("click", function () {
                show(spot.to, true);
            });
            spots.appendChild(button);
        });
    }

    backButton.addEventListener("click", function () {
        var back = trail.pop();

        if (back) {
            show(back, false);
        }
    });

    resetButton.addEventListener("click", function () {
        trail = [];
        show(data.start, false);
    });

    hintButton.addEventListener("click", function () {
        var on = root.classList.toggle("proto--hints");

        hintButton.setAttribute("aria-pressed", String(on));
    });

    // Every screen is fetched up front, so a tap never waits on the network
    Object.keys(data.screens).forEach(function (name) {
        new Image().src = data.path + name + ".webp";
    });

    root.hidden = false;
    show(data.start, false);
})();
