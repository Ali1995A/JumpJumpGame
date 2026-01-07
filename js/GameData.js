var GameData = {
    score: 0,
    jumpheight: 17,
    level: 22,
    speed: 0,
    probability: 0
};
var Player = {
    x:0,
    y:0,
    direction:1,
    condition:0,
    Yacceleration:0
};
var mouseX ;
var mouseY ;

// 角色逻辑尺寸（绘制与碰撞都以此为准；PNG 像素大小可任意）
var PLAYER_W = 60;
var PLAYER_H = 60;
