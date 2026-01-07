if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            var self = this, start, finish;
            return window.setTimeout(function () {
                start = +new Date();
                callback(start);
                finish = +new Date();
                self.timeout = 1000 / 60 - (finish - start);
            }, self.timeout);
        });
}



function jump() {
    Player.y = Player.y - Player.Yacceleration;
    Player.Yacceleration -= 0.5;
    if (Player.Yacceleration < 0) {
        Player.condition = 0;
    }
    if (Player.Yacceleration < -10) {
        Player.Yacceleration = -10;
    }
}

function move(context) {
    for (let i = 0; i < panelgroup.length; i++) {
        var PanelX = panelgroup[i].x;
        var PanelY = panelgroup[i].y;
        var status = panelgroup[i].status;
        var pcolor = panelgroup[i].pcolor;
        var plength = panelgroup[i].plength;
        context.beginPath();
        context.moveTo(PanelX - plength / 2, PanelY);
        context.lineTo(PanelX + plength / 2, PanelY);
        if (status) {
            context.strokeStyle = pcolor;
        } else {
            context.strokeStyle = "#c4c4c4";
        }

        context.stroke();
    }
    if (mouseX == null) {
        drawSprite(Rdoodle, Player.x, Player.y, false);
    }


    if (mouseX < Player.x - 5 && mouseX >= Player.x - 15) {
        Player.direction = 0;
        Player.x = Player.x - 5;
    }
    if (mouseX < Player.x - 15) {
        Player.direction = 0;
        Player.x = Player.x - 10;
    }


    if (mouseX > Player.x + 5 && mouseX <= Player.x + 15) {
        Player.direction = 1;
        Player.x = Player.x + 5;
    }
    if (mouseX > Player.x + 15) {
        Player.direction = 1;
        Player.x = Player.x + 10;
    }
    if (Player.direction == 1) {

        if (chara == 1) {
            drawSprite(Rdoodle, Player.x, Player.y, false);
        }
        else if (chara == 2) {
            drawSprite(Rfrog, Player.x, Player.y, false);
        }
    }
    if (Player.direction == 0) {
        if (chara == 1) {
            drawSprite(Rdoodle, Player.x, Player.y, true);
        }
        else if (chara == 2) {
            drawSprite(Rfrog, Player.x, Player.y, true);
        }
    }
}
function changeposition() {
    for (let i = 0; i < panelgroup.length; i++) {

        var panel = panelgroup[i];
        if (panel.status == 2) {
            panel.x += Width / ChangeBasis;
            if (panel.x >= Width - 40) {
                panelgroup[i].status = 3;
            }
        }
        else if (panel.status == 3) {
            panel.x -= Width / ChangeBasis;
            if (panel.x <= 40) {
                panelgroup[i].status = 2;
            }
        }
    }
}
function gamescroll() {
    if (Player.y <= Height / 2) {
        var distance = Height / 2 - Player.y;
        for (let i = 0; i < panelgroup.length; i++) {

            var panel = panelgroup[i];
            panel.y += distance / 2;
        }
        Player.y += distance / 2;
        GameData.score += distance / 20;
    }

    updateDifficulty();

    if (GameData.score >= 500 && !window.__skinSwapped500) {
        window.__skinSwapped500 = true;
        if (typeof setImageWithFallback === "function") {
            setImageWithFallback(Ldoodle, "img/jett_left_2.png", Ldoodle.src);
            setImageWithFallback(Rdoodle, "img/jett_right_2.png", Rdoodle.src);
            setImageWithFallback(Lfrog, "img/rubble_left_2.png", Lfrog.src);
            setImageWithFallback(Rfrog, "img/rubble_right_2.png", Rfrog.src);
        }
    }

    if (panelgroup[0].y > Height) {
        panelgroup.shift();
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function updateDifficulty() {
    var score = GameData.score || 0;
    var t = clamp(score / 1300, 0, 1);
    var eased = Math.pow(t, 1.35);

    GameData.jumpheight = Math.round(17 - eased * 4); // 17 -> 13
    GameData.level = Math.round(22 + eased * 98); // 22 -> 120
    GameData.probability = Math.round(eased * 90); // 0 -> 90

    ChangeBasis = Math.round(240 - eased * 160); // 240 -> 80
}
