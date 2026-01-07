var ChangeBasis = 240;

(function () {
    function getViewportHeight() {
        if (window.visualViewport && typeof window.visualViewport.height === "number") {
            return window.visualViewport.height;
        }
        return window.innerHeight;
    }

    function setViewportUnit() {
        var vh = getViewportHeight() * 0.01;
        document.documentElement.style.setProperty("--vh", vh + "px");
    }

    function detectWeChat() {
        return /MicroMessenger/i.test(navigator.userAgent);
    }

    setViewportUnit();

    if (detectWeChat()) {
        document.documentElement.classList.add("is-wechat");
    }

    window.addEventListener("orientationchange", function () {
        setTimeout(setViewportUnit, 50);
    });
    window.addEventListener("resize", setViewportUnit);

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", setViewportUnit);
    }
})();
