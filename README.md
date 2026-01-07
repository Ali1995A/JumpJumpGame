# JumpJumpGame

这是一个我用html与JavaScript撰写的小游戏，功能还在慢慢更新。

这里是它的demo: https://lhp-pku.github.io/

## 功能
+ 可以选择多种角色
+ 角色方向随着跳跃方向变化
+ 游戏难度随着分数升高而增加
+ 杠杆可以移动，长短随机
+ 超过1000分有彩蛋（现在改到了500分，因为我自己打不到1000分）

## 日志
+ 2021/6/16 在Arimase与NaturezzZ的帮助下加入了排行榜
+ 2021/6/20 排行榜数据库被攻击条目数累计超过300

## Vercel 部署
1. 在 Vercel 新建项目并导入本仓库
2. Framework Preset 选择 `Other`
3. Build Command 留空，Output Directory 留空（根目录直接静态托管）

## 角色资源替换（可选）
出于版权原因，本仓库不内置第三方 IP 素材。你可以自行在 `img/` 放置同名图片来替换角色：
- `img/jett_left.png`、`img/jett_right.png`
- `img/rubble_left.png`、`img/rubble_right.png`

可选换皮（500 分后尝试加载，不存在则忽略）：
- `img/jett_left_2.png`、`img/jett_right_2.png`
- `img/rubble_left_2.png`、`img/rubble_right_2.png`
