var chara = 1;
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

var Height = 0;
var Width = 0;
var __dpr = 1;
var __backgroundPattern = null;
var __gameStarted = false;
var __resizeTimer = null;

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

backgroundimg.onload = function (ev) {
    __backgroundPattern = context.createPattern(backgroundimg, "repeat");
    drawWelcomeScreen();

    alert("您好，欢迎来到跳跳游戏！排行榜已上线，快来挑战吧！\n请理性游戏，不要沉迷；请理性刷分，不要攻击数据库！\n衷心感谢您的游玩，您的愉悦是本游戏最大的荣幸！");
    
    function startanimation() {
        context.clearRect(0, 0, Width, Height);

        CreatePanel(context);
        context.fillStyle = __backgroundPattern;
        context.fillRect(0, 0, Width, Height);
        context.font = "bold 20px Arial";
        context.textAlign = "left";
        context.fillStyle = "#ff2f98";
        context.fillText("Score: " + parseInt(GameData.score), 20, 30);
        // animation(context);
        jump();
        collide();
        gamescroll();
        move(context);

        if (Player.y > Height) {
            window.cancelAnimationFrame(startanimation);
            var userName = prompt("Game Over!\nYour score is: " + parseInt(GameData.score) + "\n请留下尊姓大名!", "Anyomous User");
            alert(userName+", 你的得分是: " + parseInt(GameData.score)+"\n太棒了! 再来一局吧?");

            var userdata = {
                name :        userName, 
                score :       GameData.score
            };
            $.ajax({
                type :        "POST",
                async :       false,
                url :         "https://phoenix-jump-backend.zhengnq.com/insert",
                contentType : "application/json",
                dataType :    "json",
                data :        JSON.stringify(userdata),
                error :       function(jqXHR, textStatus, errorThrown){
                                  console.info(jqXHR.responseText);
                              }
            });

            $.ajax({
                 type :       "GET",
                 async :      false,
                 url :        "https://phoenix-jump-backend.zhengnq.com/query", 
                 success :    function(scores){
                                  alert(scores);
                              },
                 error :      function(jqXHR, textStatus, errorThrown){
                                  console.info(jqXHR.responseText);
                              }
            });
        
            location.reload();
        } else {
            requestAnimationFrame(startanimation);
            changeposition();
        }

    }
    var start1 = document.getElementById("startBTN");
    var start2 = document.getElementById("startBTN2");
    var overlay = document.getElementById("overlay");

    function beginGame(selectedChara) {
        if (__gameStarted) return;

        chara = selectedChara;
        __gameStarted = true;

        window.requestAnimationFrame(startanimation);
        start1.style.display = "none";
        start2.style.display = "none";
        if (overlay) overlay.style.display = "none";

        Player.x = Width / 2 - PLAYER_W / 2;
        Player.y = Height - (selectedChara === 1 ? 220 : 170);

        panelgroup.push({
            x: Player.x + PLAYER_W / 2,
            y: Player.y + 90,
            status: 1,
            pcolor: "#ff4aa6",
            plength: 60
        });
    }

    start1.addEventListener("click", function () {
        beginGame(1);
    });
    start2.addEventListener("click", function () {
        beginGame(2);
    });
    start1.addEventListener("touchstart", function (e) {
        e.preventDefault();
        beginGame(1);
    }, { passive: false });
    start2.addEventListener("touchstart", function (e) {
        e.preventDefault();
        beginGame(2);
    }, { passive: false });

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

};


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
    });
    canvas.addEventListener("pointermove", function (e) {
        setPointerFromClient(e.clientX, e.clientY);
    });
}

canvas.addEventListener("touchstart", function (e) {
    if (e.touches && e.touches[0]) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
}, { passive: false });


