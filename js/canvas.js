var chara = 1;
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var Height = 0;
var Width = 0;
var __dpr = 1;
var __backgroundPattern = null;
var __gameStarted = false;
var __resizeTimer = null;
var __gameState = "menu"; // menu | ready | running | gameover
var __rafId = null;

var __overlay = null;
var __roleSelect = null;
var __pausePrompt = null;
var __gameOverModal = null;
var __gameOverScoreEl = null;
var __playerNameInput = null;
var __restartBTN = null;

function getViewportRect() {
    if (window.visualViewport) {
        return {
            width: window.visualViewport.width,
            height: window.visualViewport.height
        };
    }
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

function computeCanvasCssSize() {
    var viewport = getViewportRect();
    var maxW = viewport.width;
    var maxH = viewport.height;

    var cssH = Math.floor(maxH * 0.92);
    var cssW = Math.floor(Math.min(maxW * 0.96, cssH * 0.72));

    cssW = Math.max(320, Math.min(cssW, Math.floor(maxW)));
    cssH = Math.max(420, Math.min(cssH, Math.floor(maxH)));

    return { cssW: cssW, cssH: cssH };
}

function resizeCanvas(preserveGameState) {
    var prevW = Width;
    var prevH = Height;

    var size = computeCanvasCssSize();
    Width = size.cssW;
    Height = size.cssH;

    canvas.style.width = Width + "px";
    canvas.style.height = Height + "px";

    __dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(Width * __dpr);
    canvas.height = Math.floor(Height * __dpr);

    context.setTransform(__dpr, 0, 0, __dpr, 0, 0);
    context.imageSmoothingEnabled = true;

    if (preserveGameState && prevW > 0 && prevH > 0) {
        var sx = Width / prevW;
        var sy = Height / prevH;

        if (typeof Player === "object" && Player) {
            Player.x *= sx;
            Player.y *= sy;
        }

        if (Array.isArray(panelgroup)) {
            for (var i = 0; i < panelgroup.length; i++) {
                panelgroup[i].x *= sx;
                panelgroup[i].y *= sy;
                panelgroup[i].plength *= sx;
            }
        }
    }

    if (typeof backgroundimg !== "undefined" && backgroundimg && backgroundimg.complete) {
        __backgroundPattern = context.createPattern(backgroundimg, "repeat");
    }

    if (!__gameStarted && __backgroundPattern && typeof drawWelcomeScreen === "function") {
        drawWelcomeScreen();
    }

    if (preserveGameState && __gameState !== "running" && __gameState !== "menu") {
        renderStaticFrame();
    }
}

function scheduleResize() {
    clearTimeout(__resizeTimer);
    __resizeTimer = setTimeout(function () {
        resizeCanvas(__gameStarted);
    }, 80);
}

resizeCanvas(false);
window.addEventListener("resize", scheduleResize);
window.addEventListener("orientationchange", scheduleResize);
if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
}
var backgroundimg = new Image();
var Ldoodle = new Image();
var Rdoodle = new Image();
var Lfrog = new Image();
var Rfrog = new Image();
var Mouse = new Image();
var Title = new Image();
var Select = new Image();

function setImageWithFallback(img, primarySrc, fallbackSrc) {
    if (img.__currentPrimary === primarySrc) return;
    img.__currentPrimary = primarySrc;
    img.__fallbackSrc = fallbackSrc;
    img.onload = function () {
        prepareSprite(img);
    };
    img.onerror = function () {
        if (img.__fallbackSrc) {
            img.onerror = null;
            img.src = img.__fallbackSrc;
        }
    };
    img.src = primarySrc;
}

// 角色资源：默认使用用户自行放置的图片；没有的话回退到仓库自带的素材
setImageWithFallback(Ldoodle, "img/jett_left.png", "img/Ldoodle.png");
setImageWithFallback(Rdoodle, "img/jett_right.png", "img/Rdoodle.png");
setImageWithFallback(Lfrog, "img/rubble_left.png", "img/Lfrog.png");
setImageWithFallback(Rfrog, "img/rubble_right.png", "img/Rfrog.png");
Mouse.src = "img/mouse.png";
Title.src = "img/title.png";
Select.src = "img/select.png";
backgroundimg.src = "img/bg.jpg";

function prepareSprite(img) {
    if (!img || img.__spritePrepared || !img.complete || img.naturalWidth === 0) return;
    img.__spritePrepared = true;

    try {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (!w || !h) return;

        // 扫描 alpha 找到内容 bbox；大图一次性扫描可能较慢，做个上限保护
        if (w * h > 2500000) return;

        var temp = document.createElement("canvas");
        temp.width = w;
        temp.height = h;
        var tctx = temp.getContext("2d");
        tctx.drawImage(img, 0, 0);
        var data = tctx.getImageData(0, 0, w, h).data;

        var minX = w, minY = h, maxX = -1, maxY = -1;
        for (var y = 0; y < h; y++) {
            var row = y * w * 4;
            for (var x = 0; x < w; x++) {
                var a = data[row + x * 4 + 3];
                if (a > 10) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (maxX < 0 || maxY < 0) return;

        var bw = maxX - minX + 1;
        var bh = maxY - minY + 1;
        if (bw <= 0 || bh <= 0) return;

        // 如果内容几乎铺满整图，就不裁剪
        if (bw / w > 0.98 && bh / h > 0.98) return;

        var trimmed = document.createElement("canvas");
        trimmed.width = bw;
        trimmed.height = bh;
        trimmed.getContext("2d").drawImage(temp, minX, minY, bw, bh, 0, 0, bw, bh);
        img.__trimCanvas = trimmed;
        img.__trimW = bw;
        img.__trimH = bh;
    } catch (e) {
        // ignore
    }
}

function drawSprite(img, x, y, facingLeft) {
    if (!img) return;
    if (img.complete && !img.__spritePrepared) {
        prepareSprite(img);
    }

    var source = img.__trimCanvas || img;
    var sw = img.__trimW || (img.naturalWidth || img.width);
    var sh = img.__trimH || (img.naturalHeight || img.height);
    if (!sw || !sh) return;

    var scale = Math.min(PLAYER_W / sw, PLAYER_H / sh);
    var dw = sw * scale;
    var dh = sh * scale;
    var dx = x + (PLAYER_W - dw) / 2;
    var dy = y + (PLAYER_H - dh) / 2;

    if (facingLeft) {
        context.save();
        context.translate(x + PLAYER_W / 2, y);
        context.scale(-1, 1);
        context.drawImage(source, 0, 0, sw, sh, -PLAYER_W / 2 + (PLAYER_W - dw) / 2, (PLAYER_H - dh) / 2, dw, dh);
        context.restore();
    } else {
        context.drawImage(source, 0, 0, sw, sh, dx, dy, dw, dh);
    }
}

function drawWelcomeScreen() {
    if (!__backgroundPattern) return;

    var pattern = __backgroundPattern;
    context.fillStyle = pattern;
    context.fillRect(0, 0, Width, Height);
    context.beginPath();
    context.moveTo(Width / 2 - 30, Height - 60);
    context.lineTo(Width / 2 + 30, Height - 60);
    context.lineWidth = 10;
    context.strokeStyle = "#ff4aa6";
    context.lineCap = "round";

    Player.x = Width / 2 - PLAYER_W / 2;
    Player.y = Height - 125;

    drawSprite(Rdoodle, Width / 2 - PLAYER_W / 2, Height - 290, false);
    drawSprite(Rfrog, Width / 2 - PLAYER_W / 2, Height - 170, false);
    context.drawImage(Title, Player.x + 30 - 150, Player.y - 400);
    context.drawImage(Select, Player.x + 30 - 100, Player.y + 60);
}

function cancelGameLoop() {
    if (__rafId != null) {
        window.cancelAnimationFrame(__rafId);
        __rafId = null;
    }
}

function syncOverlayVisibility() {
    if (!__overlay) return;
    if (__roleSelect) __roleSelect.style.display = (__gameState === "menu") ? "flex" : "none";
    if (__pausePrompt) __pausePrompt.style.display = (__gameState === "ready") ? "flex" : "none";
    if (__gameOverModal) __gameOverModal.style.display = (__gameState === "gameover") ? "flex" : "none";
}

function setGameState(nextState) {
    __gameState = nextState;
    __gameStarted = nextState !== "menu";
    syncOverlayVisibility();
}

function resetSkinsToDefault() {
    window.__skinSwapped500 = false;
    if (typeof setImageWithFallback === "function") {
        setImageWithFallback(Ldoodle, "img/jett_left.png", "img/Ldoodle.png");
        setImageWithFallback(Rdoodle, "img/jett_right.png", "img/Rdoodle.png");
        setImageWithFallback(Lfrog, "img/rubble_left.png", "img/Lfrog.png");
        setImageWithFallback(Rfrog, "img/rubble_right.png", "img/Rfrog.png");
    }
}

function resetGameData() {
    GameData.score = 0;
    GameData.jumpheight = 17;
    GameData.level = 22;
    GameData.speed = 0;
    GameData.probability = 0;

    Player.direction = 1;
    Player.condition = 0;
    Player.Yacceleration = 0;

    mouseX = null;
    mouseY = null;

    if (Array.isArray(panelgroup)) panelgroup.length = 0;
    resetSkinsToDefault();
}

function drawPlatforms(context) {
    if (!Array.isArray(panelgroup)) return;
    context.lineWidth = 6;
    context.lineCap = "round";
    for (let i = 0; i < panelgroup.length; i++) {
        var PanelX = panelgroup[i].x;
        var PanelY = panelgroup[i].y;
        var status = panelgroup[i].status;
        var pcolor = panelgroup[i].pcolor;
        var plength = panelgroup[i].plength;
        context.beginPath();
        context.moveTo(PanelX - plength / 2, PanelY);
        context.lineTo(PanelX + plength / 2, PanelY);
        context.strokeStyle = status ? pcolor : "#c4c4c4";
        context.stroke();
    }
}

function drawPlayerStatic() {
    var sprite = (chara === 2) ? Rfrog : Rdoodle;
    var facingLeft = Player.direction === 0;
    drawSprite(sprite, Player.x, Player.y, facingLeft);
}

function renderStaticFrame() {
    context.clearRect(0, 0, Width, Height);
    if (__backgroundPattern) {
        context.fillStyle = __backgroundPattern;
        context.fillRect(0, 0, Width, Height);
    }

    context.font = "bold 20px Arial";
    context.textAlign = "left";
    context.fillStyle = "#ff2f98";
    context.fillText("Score: " + parseInt(GameData.score), 20, 30);

    drawPlatforms(context);
    drawPlayerStatic();
}

function beginGame(selectedChara) {
    if (__gameState !== "menu") return;

    cancelGameLoop();
    resetGameData();

    chara = selectedChara;
    Player.x = Width / 2 - PLAYER_W / 2;
    Player.y = Height - (selectedChara === 1 ? 220 : 170);

    panelgroup.push({
        x: Player.x + PLAYER_W / 2,
        y: Player.y + 90,
        status: 1,
        pcolor: "#ff4aa6",
        plength: 60
    });

    setGameState("ready");
    renderStaticFrame();
}

function startRunning() {
    if (__gameState !== "ready") return;
    Player.condition = 1;
    Player.Yacceleration = Math.max(Player.Yacceleration || 0, GameData.jumpheight);
    setGameState("running");
    __rafId = window.requestAnimationFrame(startanimation);
}

function submitScore(name, score) {
    try {
        if (name) localStorage.setItem("jumpjumpgame.name", name);
    } catch (e) {
        // ignore
    }

    if (typeof $ !== "function") return;
    $.ajax({
        type: "POST",
        async: true,
        url: "https://phoenix-jump-backend.zhengnq.com/insert",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify({ name: name || "Anyomous User", score: score }),
        error: function (jqXHR) {
            console.info(jqXHR.responseText);
        }
    });
}

function showGameOver() {
    cancelGameLoop();
    setGameState("gameover");

    if (__gameOverScoreEl) {
        __gameOverScoreEl.textContent = "Score: " + parseInt(GameData.score);
    }
    if (__playerNameInput) {
        var saved = "";
        try {
            saved = localStorage.getItem("jumpjumpgame.name") || "";
        } catch (e) {
            saved = "";
        }
        if (!__playerNameInput.value) __playerNameInput.value = saved;
        __playerNameInput.focus();
    }

    renderStaticFrame();
}

function resetToMenu() {
    cancelGameLoop();
    resetGameData();
    setGameState("menu");
    if (__backgroundPattern) drawWelcomeScreen();
}

backgroundimg.onload = function (ev) {
    __backgroundPattern = context.createPattern(backgroundimg, "repeat");
    drawWelcomeScreen();

    alert("您好，欢迎来到跳跳游戏！排行榜已上线，快来挑战吧！\n请理性游戏，不要沉迷；请理性刷分，不要攻击数据库！\n衷心感谢您的游玩，您的愉悦是本游戏最大的荣幸！");
    
    __overlay = document.getElementById("overlay");
    __roleSelect = __overlay ? __overlay.querySelector(".role-select") : null;
    __pausePrompt = document.getElementById("pausePrompt");
    __gameOverModal = document.getElementById("gameOverModal");
    __gameOverScoreEl = document.getElementById("gameOverScore");
    __playerNameInput = document.getElementById("playerNameInput");
    __restartBTN = document.getElementById("restartBTN");

    var start1 = document.getElementById("startBTN");
    var start2 = document.getElementById("startBTN2");

    if (__restartBTN) {
        __restartBTN.addEventListener("click", function () {
            var name = (__playerNameInput && __playerNameInput.value) ? __playerNameInput.value.trim() : "";
            if (name || GameData.score) {
                submitScore(name || "Anyomous User", GameData.score);
            }
            resetToMenu();
        });
        __restartBTN.addEventListener("touchstart", function (e) {
            e.preventDefault();
            var name = (__playerNameInput && __playerNameInput.value) ? __playerNameInput.value.trim() : "";
            if (name || GameData.score) {
                submitScore(name || "Anyomous User", GameData.score);
            }
            resetToMenu();
        }, { passive: false });
    }

    if (start1) {
        start1.addEventListener("click", function () {
            beginGame(1);
        });
        start1.addEventListener("touchstart", function (e) {
            e.preventDefault();
            beginGame(1);
        }, { passive: false });
    }
    if (start2) {
        start2.addEventListener("click", function () {
            beginGame(2);
        });
        start2.addEventListener("touchstart", function (e) {
            e.preventDefault();
            beginGame(2);
        }, { passive: false });
    }

    var roleDoodle = document.getElementById("roleDoodle");
    var roleFrog = document.getElementById("roleFrog");
    if (roleDoodle) {
        roleDoodle.addEventListener("click", function () {
            beginGame(1);
        });
        roleDoodle.addEventListener("touchstart", function (e) {
            e.preventDefault();
            beginGame(1);
        }, { passive: false });
    }
    if (roleFrog) {
        roleFrog.addEventListener("click", function () {
            beginGame(2);
        });
        roleFrog.addEventListener("touchstart", function (e) {
            e.preventDefault();
            beginGame(2);
        }, { passive: false });
    }

    syncOverlayVisibility();
};

function startanimation() {
    if (__gameState !== "running") return;

    context.clearRect(0, 0, Width, Height);

    CreatePanel(context);
    context.fillStyle = __backgroundPattern;
    context.fillRect(0, 0, Width, Height);
    context.font = "bold 20px Arial";
    context.textAlign = "left";
    context.fillStyle = "#ff2f98";
    context.fillText("Score: " + parseInt(GameData.score), 20, 30);

    jump();
    collide();
    gamescroll();
    move(context);

    if (Player.y > Height) {
        showGameOver();
        return;
    }

    changeposition();
    __rafId = window.requestAnimationFrame(startanimation);
}

function getLocation(x, y) {
    var bbox = canvas.getBoundingClientRect();
    return {
        x: (x - bbox.left) * (Width / bbox.width),
        y: (y - bbox.top) * (Height / bbox.height)
    };
}

function setPointerFromClient(clientX, clientY) {
    var location = getLocation(clientX, clientY);
    mouseX = parseInt(location.x) - PLAYER_W / 2;
    mouseY = parseInt(location.y);
}

canvas.addEventListener("mousemove", function (e) {
    setPointerFromClient(e.clientX, e.clientY);
});

if (window.PointerEvent) {
    canvas.addEventListener("pointerdown", function (e) {
        setPointerFromClient(e.clientX, e.clientY);
        startRunning();
    });
    canvas.addEventListener("pointermove", function (e) {
        setPointerFromClient(e.clientX, e.clientY);
    });
}

canvas.addEventListener("click", function () {
    startRunning();
});

canvas.addEventListener("touchstart", function (e) {
    if (e.touches && e.touches[0]) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }
    startRunning();
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
}, { passive: false });


