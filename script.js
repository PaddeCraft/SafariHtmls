/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

function uuid() {
    // https://stackoverflow.com/a/2117523/20946335
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

function fullscreen(element) {
    var enable = !element.hasAttribute("data-exit-fullscreen-translate");

    if (enable) {
        element.dataset.exitFullscreenTranslate = element.style.transform;
        element.style.transform = "translate(0px,0px)";
        element.dataset.exitFullW = element.style.width;
        element.dataset.exitFullH = element.style.height;
        element.style.width = window.getComputedStyle(
            element.parentElement
        ).width;
        element.style.height = window.getComputedStyle(
            element.parentElement
        ).height;
    } else {
        element.style.width = element.dataset.exitFullW;
        element.style.height = element.dataset.exitFullH;
        element.style.transform = element.dataset.exitFullscreenTranslate;
        delete element.dataset.exitFullH;
        delete element.dataset.exitFullW;
        delete element.dataset.exitFullscreenTranslate;
    }
}

/* -------------------------------------------------------------------------- */
/*                               Event listeners                              */
/* -------------------------------------------------------------------------- */

document.getElementById("open-new").addEventListener("click", function () {
    document.getElementById("open-input").click();
});

document.getElementById("open-input").addEventListener("change", function () {
    var reader = new FileReader();
    var filename = this.files[0].name;
    reader.onload = function () {
        create_window(
            reader.result,
            filename,
            reader.result.split(";")[0] == "data:text/html"
        );
    };
    reader.readAsDataURL(this.files[0]);
});

document.getElementById("info").addEventListener("click", function () {
    create_window("./info.html", "Usage/About", false);
});

/* -------------------------------------------------------------------------- */
/*                               Window creation                              */
/* -------------------------------------------------------------------------- */

function initialize_window_interactions(selector) {
    interact(selector).resizable({
        // resize from all edges and corners
        edges: { left: true, right: true, bottom: true, top: true },

        listeners: {
            move(event) {
                if (
                    !event.target.hasAttribute("data-exit-fullscreen-translate")
                ) {
                    var target = event.target;
                    var x = parseFloat(target.getAttribute("data-x")) || 0;
                    var y = parseFloat(target.getAttribute("data-y")) || 0;

                    // update the element's style
                    target.style.width = event.rect.width + "px";
                    target.style.height = event.rect.height + "px";

                    // translate when resizing from top or left edges
                    x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    target.style.transform =
                        "translate(" + x + "px," + y + "px)";

                    target.setAttribute("data-x", x);
                    target.setAttribute("data-y", y);
                }
            },
        },
        modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
                outer: "parent",
            }),

            // minimum size
            interact.modifiers.restrictSize({
                min: { width: 500, height: 500 },
            }),
        ],

        inertia: true,
    });
    interact(selector + " > .title-bar > .window-name")
        .draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: function (x, y, el) {
                        return el.element.parentElement.parentElement
                            .parentElement;
                    },
                }),
            ],
            onmove: function (event) {
                if (
                    !event.target.parentElement.parentElement.hasAttribute(
                        "data-exit-fullscreen-translate"
                    )
                ) {
                    var target = event.target,
                        x =
                            (parseFloat(
                                target.parentElement.parentElement.getAttribute(
                                    "data-x"
                                )
                            ) || 0) + event.dx,
                        y =
                            (parseFloat(
                                target.parentElement.parentElement.getAttribute(
                                    "data-y"
                                )
                            ) || 0) + event.dy;
                    target.parentElement.parentElement.style.webkitTransform =
                        target.parentElement.parentElement.style.transform =
                            "translate(" + x + "px, " + y + "px)";
                    target.parentElement.parentElement.setAttribute(
                        "data-x",
                        x
                    );
                    target.parentElement.parentElement.setAttribute(
                        "data-y",
                        y
                    );
                }
            },
        })
        .on("doubletap", function (event) {
            fullscreen(event.target.parentElement.parentElement);
        });

    document
        .querySelector(selector)
        .querySelector(".maximize")
        .addEventListener("click", function () {
            fullscreen(this.parentElement.parentElement.parentElement);
        });
    document
        .querySelector(selector)
        .querySelector(".minimize")
        .addEventListener("click", function () {
            var app_window = this.parentElement.parentElement.parentElement;
            app_window.style.display = "none";

            var span = document.createElement("span");
            span.classList.add("minimized-window");
            span.innerText = app_window.querySelector(".window-name").innerText;
            span.onclick = function () {
                app_window.style.display = "flex";
                span.remove();
            };
            document
                .getElementById("taskbar")
                .insertAdjacentElement("beforeend", span);
        });
    document
        .querySelector(selector)
        .querySelector(".close")
        .addEventListener("click", function () {
            var app_window = this.parentElement.parentElement.parentElement;
            var window_id = app_window.dataset.wid;
            // TODO: Check if there are open devtools for this id
            app_window.remove();
        });
}

function create_window(data_url, title, allow_devtools) {
    var window_id = uuid();
    var center_x = (document.body.offsetWidth - 600) / 2;
    var center_y = (document.body.offsetHeight - 600) / 2;
    document.querySelector("#windows").insertAdjacentHTML(
        "beforeend",
        `
            <div class="window"
                 data-wid="${window_id}"
                 style="transform: translate(${center_x}px, ${center_y}px);"
                 data-x="${center_x}" data-y="${center_y}"
            >
                <div class="title-bar">
                    <span class="window-name">${title}</span>
                    <div class="window-icons">
                        <span class="devtools window-icon" ${
                            allow_devtools ? "" : 'style="display:none;"'
                        }>D</span>
                        <span class="maximize window-icon">^</span>
                        <span class="minimize window-icon">_</span>
                        <span class="close window-icon">X</span>
                    </div>
                </div>
                <div class="main-content">
                    <iframe src="${data_url}" class="iframe"></iframe>
                </div>
            </div>`
    );

    const window_selector = `[data-wid="${window_id}"]`;

    initialize_window_interactions(window_selector);

    if (allow_devtools) {
        var iframe = document
            .querySelector(window_selector)
            .querySelector("iframe");

        iframe.srcdoc = atob(iframe.src.split(",")[1]);
        delete iframe.src;

        iframe.addEventListener("load", function () {
            var iframe_window = iframe.contentWindow;
            var iframe_document = iframe_window.document;

            var devtools_script = document.createElement("script");
            devtools_script.src = window.origin + "/devtools-iframe.js";
            devtools_script.dataset.uuid = window_id;
            devtools_script.id = "safarihtmls-devtools-script";

            iframe_document
                .getElementsByTagName("head")[0]
                .appendChild(devtools_script);

            devtools_script.addEventListener("load", function () {
                iframe_window.postMessage(
                    { type: "run_js", data: "test()" },
                    "*"
                );
                iframe_window.postMessage({ type: "get_dom" }, "*");
            });
        });
    }
}

window.onmessage = function (e) {
    console.log(e);
};

document.addEventListener(
    "touchmove",
    function (event) {
        event = event.originalEvent || event;
        if (event.scale > 1) {
            event.preventDefault();
        }
    },
    false
);
