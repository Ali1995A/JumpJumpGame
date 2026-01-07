function collide() {
    for (let i = 0; i < panelgroup.length; i++) {
        var panel = panelgroup[i];
        if(Player.condition == 0){
            var playerCenterX = Player.x + PLAYER_W / 2;
            if (playerCenterX >= panel.x - panel.plength / 2 && playerCenterX <= panel.x + panel.plength / 2) {
                var feetY = Player.y + PLAYER_H;
                if (feetY <= panel.y + 1 && feetY >= panel.y - 10) {
                    if(panel.status == 0){
                        panelgroup.splice(i,1);
                    }
                    Player.condition = 1;
                    Player.Yacceleration = GameData.jumpheight;
                }
            }
        }
    }
}
