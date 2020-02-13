"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var bg = new g.E({
            scene: scene,
            x: 0, y: 0
        });
        _this.append(bg);
        var base = new g.E({
            scene: scene,
            x: 80,
            y: 12,
            width: 336,
            height: 336,
            touchable: true
        });
        bg.append(base);
        var baseBg = new g.FilledRect({
            scene: scene,
            x: 0,
            y: 0,
            width: 336,
            height: 336,
            cssColor: "#D0D0D0",
            opacity: 0.8
        });
        base.append(baseBg);
        var font = new g.DynamicFont({
            game: g.game,
            fontFamily: g.FontFamily.SansSerif,
            size: 15
        });
        var maps = [];
        var panelNum = 8;
        var panelSize = 336 / 8;
        //パネル配置用マップ
        for (var y = 0; y < panelNum; y++) {
            maps[y] = [];
            for (var x = 0; x < panelNum; x++) {
                var map = new g.FilledRect({
                    scene: scene,
                    x: panelSize * x,
                    y: panelSize * y,
                    width: panelSize,
                    height: panelSize,
                    cssColor: "black",
                    opacity: 0.0
                });
                base.append(map);
                var label = new g.Label({
                    scene: scene,
                    font: font,
                    text: "0",
                    fontSize: 15,
                    textColor: "white",
                    x: 10,
                    y: 10,
                    opacity: 0.0
                });
                map.append(label);
                maps[y][x] = map;
            }
        }
        //グリッド
        for (var i = 0; i <= panelNum; i++) {
            var sprTate = new g.FilledRect({
                scene: scene,
                x: panelSize * i - 1,
                y: 0,
                width: 2,
                height: panelSize * panelNum,
                cssColor: "white"
            });
            base.append(sprTate);
        }
        for (var i = 0; i <= panelNum; i++) {
            var sprYoko = new g.FilledRect({
                scene: scene,
                x: 0,
                y: panelSize * i - 1,
                width: panelSize * panelNum,
                height: (i === 1) ? 4 : 2,
                cssColor: (i === 1) ? "red" : "white"
            });
            base.append(sprYoko);
        }
        //パネル
        var panels = [];
        for (var i = 0; i < panelNum * panelNum; i++) {
            var panel = new g.FrameSprite({
                scene: scene,
                src: scene.assets["block"],
                width: panelSize * 4,
                height: panelSize,
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            });
            panels.push(panel);
            base.append(panel);
        }
        //枠
        var waku = new g.Sprite({
            scene: scene,
            src: scene.assets["waku"],
            x: 68
        });
        _this.append(waku);
        //ミス文字列
        var sprMiss = new g.Sprite({
            scene: scene,
            src: scene.assets["clear"],
            x: 68 + ((360 - 216) / 2),
            y: 100,
            srcY: 80,
            height: 80
        });
        _this.append(sprMiss);
        var isStop = false;
        var pNum = 0; //選択したブロックの添え字
        var bkX = 0;
        var px = 0;
        var py = 0;
        var minx = 0; //ブロックの長さ
        var maxx = 0;
        var moveMinX = 0; //可動域
        var moveMaxX = 0;
        var isRaise = false;
        var pointX = 0; //クリック位置とパネル位置の差分
        var comboCnt = 1;
        base.pointDown.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (pNum !== -1)
                return;
            px = Math.floor(e.point.x / panelSize);
            py = Math.floor(e.point.y / panelSize);
            var map = maps[py][px];
            pNum = map.tag;
            if (pNum === -1)
                return;
            bkX = px;
            //ブロックの長さ取得
            var cnt = -1;
            minx = 0;
            while (px + cnt >= 0) {
                if (maps[py][px + cnt].tag !== pNum) {
                    minx = cnt + 1;
                    break;
                }
                minx = cnt;
                cnt--;
            }
            cnt = 1;
            maxx = 0;
            while (px + cnt < panelNum) {
                if (maps[py][px + cnt].tag !== pNum) {
                    maxx = cnt - 1;
                    break;
                }
                maxx = cnt;
                cnt++;
            }
            //可動域取得
            cnt = 0;
            while (px + cnt >= 0) {
                if (maps[py][px + cnt].tag !== pNum && maps[py][px + cnt].tag !== -1) {
                    moveMinX = px + cnt + 1;
                    break;
                }
                moveMinX = px + cnt;
                cnt--;
            }
            cnt = 0;
            while (px + cnt < panelNum) {
                if (maps[py][px + cnt].tag !== pNum && maps[py][px + cnt].tag !== -1) {
                    moveMaxX = px + cnt - 1;
                    break;
                }
                moveMaxX = px + cnt;
                cnt++;
            }
            pointX = Math.floor((panels[pNum].x - e.point.x) / panelSize) * panelSize + (panelSize / 2);
        });
        base.pointMove.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (pNum === -1)
                return;
            var x = Math.floor((e.point.x + e.startDelta.x) / panelSize);
            if (x + minx < moveMinX)
                x = moveMinX - minx;
            if (x + maxx > moveMaxX)
                x = moveMaxX - maxx;
            if (x !== px) {
                //消す
                for (var i = minx; i <= maxx; i++) {
                    maps[py][px + i].opacity = 0;
                    setTag(maps[py][px + i], -1);
                }
                //入れ直す
                px = x;
                for (var i = minx; i <= maxx; i++) {
                    maps[py][px + i].opacity = 1;
                    setTag(maps[py][px + i], pNum);
                }
            }
            //パネルの移動
            var panel = panels[pNum];
            panel.x = e.point.x + e.startDelta.x + pointX;
            if (panel.x < maps[py][moveMinX].x) {
                panel.x = maps[py][moveMinX].x;
            }
            else if (panel.x > maps[py][moveMaxX].x - ((maxx - minx) * panelSize)) {
                panel.x = maps[py][moveMaxX].x - ((maxx - minx) * panelSize);
            }
            panel.modified();
        });
        base.pointUp.add(function (e) {
            if (!scene.isStart || isStop)
                return;
            if (pNum === -1)
                return;
            //消す
            for (var i = minx; i <= maxx; i++) {
                maps[py][px + i].opacity = 0;
                maps[py][px + i].modified();
            }
            if (px !== bkX) {
                isStop = true;
                isRaise = false;
                comboCnt = 1;
                drop();
                scene.playSound("se_move");
            }
            else {
                drawPanels();
            }
            pNum = -1;
        });
        var dropTime = 100;
        var clearTime = 500;
        //落とす
        var drop = function () {
            var flg = false;
            var _loop_1 = function (y) {
                for (var x = 0; x < panelNum; x++) {
                    var map = maps[y][x];
                    if (map.tag === -1) {
                        var arrPos = getPanels(x, y);
                        if (chkDrop(arrPos, y)) {
                            arrPos.forEach(function (p) {
                                var srcMap = maps[p.y][p.x];
                                var dstMap = maps[y][p.x];
                                setTag(dstMap, srcMap.tag);
                                setTag(srcMap, -1);
                            });
                            flg = true;
                        }
                    }
                }
            };
            for (var y = panelNum - 1; y >= 1; y--) {
                _loop_1(y);
            }
            if (flg) {
                var arr_1 = getClearLine();
                if (arr_1.length !== 0) {
                    timeline.create().wait(dropTime).call(function () {
                        lineClear(arr_1);
                        timeline.create().wait(clearTime).call(function () {
                            drop();
                        });
                    });
                }
                else {
                    flg = false;
                }
            }
            if (!flg) {
                if (!isRaise) {
                    isRaise = true;
                    timeline.create().wait(dropTime).call(function () {
                        raise();
                        drawPanels();
                        timeline.create().wait(dropTime).call(function () {
                            drop();
                        });
                    });
                }
                else {
                    isStop = false;
                    miss();
                    allClear();
                }
            }
            drawPanels();
        };
        //上にあるブロックを取得
        var getPanels = function (x, y) {
            var arr = [];
            for (var yy = y - 1; yy >= 0; yy--) {
                var map = maps[yy][x];
                if (map.tag !== -1) {
                    //左
                    var cnt = 0;
                    while (x - cnt >= 0 && map.tag === maps[yy][x - cnt].tag) {
                        arr.unshift({ x: x - cnt, y: yy });
                        cnt++;
                    }
                    //右
                    cnt = 1;
                    while (x + cnt < panelNum && map.tag === maps[yy][x + cnt].tag) {
                        arr.push({ x: x + cnt, y: yy });
                        cnt++;
                    }
                    break;
                }
            }
            return arr;
        };
        //落とせるかどうかチェック
        var chkDrop = function (arr, y) {
            if (arr.length === 0)
                return false;
            for (var i = 0; i < arr.length; i++) {
                var p = arr[i];
                for (var yy = p.y + 1; yy <= y; yy++) {
                    var map = maps[yy][p.x];
                    if (map.tag !== -1) {
                        return false;
                    }
                }
            }
            return true;
        };
        //揃っているラインを取得
        var getClearLine = function () {
            var arr = [];
            for (var y = panelNum - 1; y >= 0; y--) {
                //揃っているかチェック
                var flg = true;
                for (var x = 0; x < panelNum; x++) {
                    var map = maps[y][x];
                    if (map.tag === -1) {
                        flg = false;
                        break;
                    }
                }
                if (flg)
                    arr.push(y);
            }
            return arr;
        };
        //揃っている場合消す
        var lineClear = function (arr) {
            scene.addScore((Math.pow(arr.length, 2) * comboCnt * 270) + 30);
            if (comboCnt > 1)
                scene.setRen(comboCnt);
            scene.setCombo(arr.length);
            scene.playSound("se_clear");
            comboCnt++;
            arr.forEach(function (y) {
                var num = -1;
                var _loop_2 = function (x) {
                    var map = maps[y][x];
                    if (map.tag !== -1 && map.tag !== num) {
                        var panel_1 = panels[map.tag];
                        panel_1.frameNumber = panel_1.frameNumber + 4;
                        panel_1.modified();
                        timeline.create().every(function (a, b) {
                            panel_1.opacity = 1 - ((b * 2) % 1);
                            panel_1.modified();
                        }, clearTime / 2).wait(clearTime / 2).call(function () {
                            panel_1.opacity = 1.0;
                            panel_1.hide();
                        });
                        num = map.tag;
                        panelNumList.unshift(num);
                    }
                    setTag(map, -1);
                };
                for (var x = 0; x < panelNum; x++) {
                    _loop_2(x);
                }
            });
        };
        //最上段のブロック処理
        var miss = function () {
            var flg = false;
            for (var x = 0; x < panelNum; x++) {
                var map = maps[0][x];
                if (map.tag !== -1) {
                    flg = true;
                    break;
                }
            }
            if (flg) {
                var bkY_1 = -1;
                scene.addScore(-500);
                sprMiss.show();
                scene.playSound("se_miss");
                timeline.create().every(function (a, b) {
                    var y = Math.floor(b * (panelNum - 1));
                    if (bkY_1 === y)
                        return;
                    bkY_1 = y;
                    var num = -1;
                    for (var x = 0; x < panelNum; x++) {
                        var map = maps[y][x];
                        if (map.tag !== -1 && map.tag !== num) {
                            num = map.tag;
                            var panel = panels[num];
                            panel.frameNumber += 8;
                            panel.modified();
                        }
                    }
                }, 500).call(function () {
                    bkY_1 = -1;
                }).every(function (a, b) {
                    var y = Math.floor(b * (panelNum - 1));
                    if (bkY_1 === y)
                        return;
                    bkY_1 = y;
                    var num = -1;
                    for (var x = 0; x < panelNum; x++) {
                        var map = maps[y][x];
                        if (map.tag !== -1 && map.tag !== num) {
                            num = map.tag;
                            var panel = panels[num];
                            panel.hide();
                        }
                    }
                }, 500).wait(500).call(function () {
                    _this.reset();
                });
                isStop = true;
            }
        };
        //全消し
        var allClear = function () {
            var flg = true;
            for (var x = 0; x < panelNum; x++) {
                var map = maps[panelNum - 1][x];
                if (map.tag !== -1) {
                    flg = false;
                    break;
                }
            }
            if (flg) {
                raise();
                drawPanels();
            }
        };
        //せり上げる
        var raise = function () {
            for (var y = 0; y < panelNum - 1; y++) {
                for (var x = 0; x < panelNum; x++) {
                    var map = maps[y + 1][x];
                    var mapd = maps[y][x];
                    setTag(mapd, map.tag);
                }
            }
            createPanels(panelNum - 1);
        };
        //ブロックの位置更新
        var drawPanels = function () {
            var num = -1;
            for (var y = 0; y < panelNum; y++) {
                for (var x = 0; x < panelNum; x++) {
                    var map = maps[y][x];
                    if (map.tag !== -1 && map.tag !== num) {
                        var panel = panels[map.tag];
                        if (panel.x !== map.x || panel.y !== map.y) {
                            timeline.create(panel).moveTo(map.x, map.y, dropTime);
                        }
                        num = map.tag;
                    }
                }
            }
        };
        var panelNumList = [];
        var colors = ["green", "blue", "pink", "red", "orange", "gray"];
        var setTag = function (map, num) {
            if (num === -1) {
                map.cssColor = "black";
            }
            else {
                map.cssColor = "yellow";
            }
            map.modified();
            map.tag = num;
            var label = map.children[0];
            label.text = "" + map.tag;
            label.invalidate();
        };
        //一列ぶんのパネルの生成
        var createPanels = function (y) {
            //ブロックのリストを作成
            var list = [];
            list.length = 0;
            var cnt = 0;
            while (true) {
                var num = scene.random.get(1, 3);
                if (cnt + num > panelNum - 1) {
                    break;
                }
                cnt += num;
                list.push(num);
            }
            list.push(cnt - panelNum);
            //シャッフル
            for (var i = list.length - 1; i > 0; i--) {
                var r = scene.random.get(0, i + 1);
                var tmp = list[i];
                list[i] = list[r];
                list[r] = tmp;
            }
            var x = 0;
            list.forEach(function (num) {
                if (num <= 0) {
                    for (var i = 0; i < -num; i++) {
                        var map = maps[y][x];
                        setTag(map, -1);
                        x++;
                    }
                }
                else {
                    var numP = panelNumList.pop();
                    var panel = panels[numP];
                    panel.x = maps[y][x].x;
                    panel.y = maps[y][x].y + panelSize;
                    panel.frameNumber = num - 1;
                    panel.opacity = 1.0;
                    panel.modified();
                    panel.show();
                    for (var i = 0; i < num; i++) {
                        var map = maps[y][x];
                        setTag(map, numP);
                        x++;
                    }
                }
            });
        };
        //リセット
        _this.reset = function () {
            isStop = true;
            pNum = -1;
            sprMiss.hide();
            comboCnt = 1;
            for (var y = 0; y < panelNum; y++) {
                for (var x = 0; x < panelNum; x++) {
                    var map = maps[y][x];
                    map.opacity = 0;
                    setTag(map, -1);
                }
            }
            panelNumList.length = 0;
            for (var i = 0; i < panelNum * panelNum; i++) {
                panels[i].hide();
                panelNumList.push(i);
            }
            for (var y = 5; y < panelNum; y++) {
                createPanels(y);
            }
            drop();
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
