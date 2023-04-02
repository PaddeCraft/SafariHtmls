class Console {
    static methods = [
        "assert",
        "clear",
        "count",
        "countReset",
        "debug",
        "error",
        "info",
        "log",
        "table",
        "trace",
        "warn",
        "dir",
        "dirxml",
        "group",
        "groupCollapsed",
        "groupEnd",
        "time",
        "timeLog",
        "timeEnd",
        "exception",
        "timeStamp",
        "profile",
        "profileEnd",
    ];

    constructor(uuid) {
        this.uuid = uuid;

        Console.methods.forEach((method) => {
            this[method] = function () {
                window.top.postMessage(
                    {
                        wid: window.console.uuid,
                        type: method,
                        data: JSON.parse(
                            JSON.stringify(
                                Array.prototype.slice.call(arguments)
                            )
                        ),
                    },
                    "*"
                );
            };
        });
    }
}

window.console = new Console(
    document.getElementById("safarihtmls-devtools-script").dataset.uuid
);

window.onmessage = function (e) {
    var msg = e.data;
    switch (msg.type) {
        case "run_js":
            window.top.postMessage(
                {
                    wid: window.console.uuid,
                    type: "run_js_finished",
                    data: eval(msg.data),
                },
                "*"
            );
            break;
        case "get_dom":
            var parser = new DOMParser();
            var dom = parser.parseFromString(
                window.document.documentElement.innerHTML,
                "text/html"
            );
            console.log(dom);
            dom.querySelector("#safarihtmls-devtools-script").remove();
            window.top.postMessage(
                {
                    wid: window.console.uuid,
                    type: "dom",
                    data: JSON.parse(JSON.stringify(dom)),
                },
                "*"
            );
            break;
    }
};
