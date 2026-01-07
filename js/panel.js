var panelgroup = [];
function getRamNumber(){
    var palette = [
        "#ff4aa6",
        "#ff6eb4",
        "#ff86c2",
        "#ff9ad0",
        "#ff66cc",
        "#ff7aa2"
    ];
    return palette[Random(0, palette.length - 1)];
}
function CreatePanel(context) {
    if(panelgroup[panelgroup.length-1].y >=0){
        
        var minHeight = panelgroup[panelgroup.length-1].y;
        if(GameData.probability >= Random(0,100)){
            var status = 0;
            if(30 >= Random(0,100)){
                var status = 2;
            }
            else if(30 >= Random(0,100)){
                var status = 3;
            }
        }
        else{
            var status = 1;
        }

        var PanelX = Random(40, Width - 80);
        var PanelY = minHeight - Random(GameData.level,140);
        var PanelColor = getRamNumber();

        var t = Math.max(0, Math.min(1, (GameData.score || 0) / 1300));
        var eased = Math.pow(t, 1.1);
        var minLen = Math.round(42 - eased * 12); // 42 -> 30
        var maxLen = Math.round(70 - eased * 10); // 70 -> 60
        var PanelLength = Random(minLen, maxLen);

        panelgroup.push({
            x:PanelX,
            y:PanelY,
            status:status,
            pcolor:PanelColor,
            plength:PanelLength
        });
    }
}
