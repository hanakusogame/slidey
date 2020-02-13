import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const bg = new g.E({
			scene: scene,
			x: 0, y: 0
		});
		this.append(bg);

		const base = new g.E({
			scene: scene,
			x: 80,
			y: 12,
			width: 336,
			height: 336,
			touchable: true
		});
		bg.append(base);

		const baseBg = new g.FilledRect({
			scene: scene,
			x: 0,
			y: 0,
			width: 336,
			height: 336,
			cssColor: "#D0D0D0",
			opacity:0.8
		});
		base.append(baseBg);

		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.SansSerif,
			size: 15
		});

		const maps: g.FilledRect[][] = [];
		const panelNum = 8;
		const panelSize = 336 / 8;

		//パネル配置用マップ
		for (let y = 0; y < panelNum; y++) {
			maps[y] = [];
			for (let x = 0; x < panelNum; x++) {
				const map = new g.FilledRect({
					scene: scene,
					x: panelSize * x,
					y: panelSize * y,
					width: panelSize,
					height: panelSize,
					cssColor: "black",
					opacity:0.0
				});
				base.append(map);

				const label = new g.Label({
					scene: scene,
					font: font,
					text: "0",
					fontSize: 15,
					textColor: "white",
					x: 10,
					y: 10,
					opacity:0.0
				});
				map.append(label);

				maps[y][x] = map;
			}
		}

		//グリッド
		for (let i = 0; i <= panelNum; i++) {
			const sprTate = new g.FilledRect({
				scene: scene,
				x: panelSize * i - 1,
				y: 0,
				width: 2,
				height: panelSize * panelNum,
				cssColor: "white"
			});
			base.append(sprTate);
		}
		for (let i = 0; i <= panelNum; i++) {
			const sprYoko = new g.FilledRect({
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
		const panels: g.FrameSprite[] = [];
		for (let i = 0; i < panelNum * panelNum; i++) {
			const panel = new g.FrameSprite({
				scene: scene,
				src: scene.assets["block"] as g.ImageAsset,
				width: panelSize * 4,
				height: panelSize,
				frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
			});
			panels.push(panel);
			base.append(panel);
		}

		//枠
		const waku = new g.Sprite({
			scene: scene,
			src: scene.assets["waku"],
			x: 68
		});
		this.append(waku);

		//ミス文字列
		const sprMiss = new g.Sprite({
			scene: scene,
			src: scene.assets["clear"],
			x: 68 + ((360 - 216) / 2),
			y: 100,
			srcY: 80,
			height:80
		});
		this.append(sprMiss);

		let isStop = false;

		let pNum = 0;//選択したブロックの添え字
		let bkX = 0;
		let px = 0;
		let py = 0;
		let minx = 0;//ブロックの長さ
		let maxx = 0;
		let moveMinX = 0;//可動域
		let moveMaxX = 0;
		let isRaise = false;
		let pointX = 0;//クリック位置とパネル位置の差分
		let comboCnt = 1;

		base.pointDown.add(e => {
			if (!scene.isStart || isStop) return;
			if (pNum !== -1) return;
			px = Math.floor(e.point.x / panelSize);
			py = Math.floor(e.point.y / panelSize);
			const map = maps[py][px];
			pNum = map.tag;
			if (pNum === -1) return;

			bkX = px;

			//ブロックの長さ取得
			let cnt = -1;
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

		base.pointMove.add(e => {
			if (!scene.isStart || isStop) return;
			if (pNum === -1) return;

			let x = Math.floor((e.point.x + e.startDelta.x) / panelSize);
			if (x + minx < moveMinX) x = moveMinX - minx;
			if (x + maxx > moveMaxX) x = moveMaxX - maxx;
			if (x !== px) {
				//消す
				for (let i = minx; i <= maxx; i++) {
					maps[py][px + i].opacity = 0;
					setTag(maps[py][px + i], -1);
				}

				//入れ直す
				px = x;
				for (let i = minx; i <= maxx; i++) {
					maps[py][px + i].opacity = 1;
					setTag(maps[py][px + i], pNum);
				}
			}

			//パネルの移動
			const panel = panels[pNum];
			panel.x = e.point.x + e.startDelta.x + pointX;
			if (panel.x < maps[py][moveMinX].x) {
				panel.x = maps[py][moveMinX].x;
			} else if (panel.x > maps[py][moveMaxX].x - ((maxx - minx) * panelSize)) {
				panel.x = maps[py][moveMaxX].x - ((maxx - minx) * panelSize);
			}
			panel.modified();
		});

		base.pointUp.add(e => {
			if (!scene.isStart || isStop) return;
			if (pNum === -1) return;

			//消す
			for (let i = minx; i <= maxx; i++) {
				maps[py][px + i].opacity = 0;
				maps[py][px + i].modified();
			}

			if (px !== bkX) {

				isStop = true;
				isRaise = false;
				comboCnt = 1;
				drop();
				scene.playSound("se_move");
			} else {
				drawPanels();
			}
			pNum = -1;
		});

		const dropTime = 100;
		const clearTime = 500;
		//落とす
		const drop = () => {
			let flg = false;
			for (let y = panelNum - 1; y >= 1; y--) {
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y][x];
					if (map.tag === -1) {
						const arrPos = getPanels(x, y);
						if (chkDrop(arrPos, y)) {
							arrPos.forEach((p) => {
								const srcMap = maps[p.y][p.x];
								const dstMap = maps[y][p.x];
								setTag(dstMap, srcMap.tag);
								setTag(srcMap, -1);
							});
							flg = true;
						}
					}
				}
			}

			if (flg) {
				const arr = getClearLine();
				if (arr.length !== 0) {
					timeline.create().wait(dropTime).call(() => {
						lineClear(arr);
						timeline.create().wait(clearTime).call(() => {
							drop();
						});
					});
				} else {
					flg = false;
				}
			}

			if (!flg) {
				if (!isRaise) {
					isRaise = true;
					timeline.create().wait(dropTime).call(() => {
						raise();
						drawPanels();
						timeline.create().wait(dropTime).call(() => {
							drop();
						});
					});
				} else {
					isStop = false;
					miss();
					allClear();
				}
			}
			drawPanels();
		};

		//上にあるブロックを取得
		const getPanels = (x: number, y: number) => {
			const arr: Array<{ x: number, y: number }> = [];
			for (let yy = y - 1; yy >= 0; yy--) {
				const map = maps[yy][x];
				if (map.tag !== -1) {
					//左
					let cnt = 0;
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
		const chkDrop = (arr: Array<{ x: number, y: number }>, y: number) => {
			if (arr.length === 0) return false;
			for (let i = 0; i < arr.length; i++) {
				const p = arr[i];
				for (let yy = p.y + 1; yy <= y; yy++) {
					const map = maps[yy][p.x];
					if (map.tag !== -1) {
						return false;
					}
				}
			}
			return true;
		};

		//揃っているラインを取得
		const getClearLine = (): number[] => {
			const arr: number[] = [];
			for (let y = panelNum - 1; y >= 0; y--) {
				//揃っているかチェック
				let flg = true;
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y][x];
					if (map.tag === -1) {
						flg = false;
						break;
					}
				}
				if (flg) arr.push(y);
			}
			return arr;
		};

		//揃っている場合消す
		const lineClear = (arr: number[]) => {
			scene.addScore((Math.pow(arr.length, 2) * comboCnt * 270) + 30);
			if (comboCnt > 1) scene.setRen(comboCnt);
			scene.setCombo(arr.length);
			scene.playSound("se_clear");
			comboCnt++;

			arr.forEach((y) => {
				let num = -1;
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y][x];
					if (map.tag !== -1 && map.tag !== num) {
						const panel = panels[map.tag];
						panel.frameNumber = panel.frameNumber + 4;
						panel.modified();
						timeline.create().every((a: number, b: number) => {
							panel.opacity = 1 - ((b * 2) % 1);
							panel.modified();
						}, clearTime / 2).wait(clearTime / 2).call(() => {
							panel.opacity = 1.0;
							panel.hide();
						});
						num = map.tag;
						panelNumList.unshift(num);
					}
					setTag(map, -1);
				}
			});
		};

		//最上段のブロック処理
		const miss = () => {

			let flg = false;
			for (let x = 0; x < panelNum; x++) {
				const map = maps[0][x];
				if (map.tag !== -1) {
					flg = true;
					break;
				}
			}
			if (flg) {
				let bkY = -1;
				scene.addScore(-500);
				sprMiss.show();
				scene.playSound("se_miss");
				timeline.create().every((a: number, b: number) => {
					const y = Math.floor(b * (panelNum - 1));
					if (bkY === y) return;
					bkY = y;
					let num = -1;
					for (let x = 0; x < panelNum; x++) {
						const map = maps[y][x];
						if (map.tag !== -1 && map.tag !== num) {
							num = map.tag;
							const panel = panels[num];
							panel.frameNumber += 8;
							panel.modified();
						}
					}
				}, 500).call(() => {
					bkY = -1;
				}).every((a: number, b: number) => {
					const y = Math.floor(b * (panelNum - 1));
					if (bkY === y) return;
					bkY = y;
					let num = -1;
					for (let x = 0; x < panelNum; x++) {
						const map = maps[y][x];
						if (map.tag !== -1 && map.tag !== num) {
							num = map.tag;
							const panel = panels[num];
							panel.hide();
						}
					}
				}, 500).wait(500).call(() => {
					this.reset();
				})

				isStop = true;
			}
		};

		//全消し
		const allClear = () => {
			let flg = true;
			for (let x = 0; x < panelNum; x++) {
				const map = maps[panelNum -1][x];
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
		const raise = () => {

			for (let y = 0; y < panelNum - 1; y++) {
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y + 1][x];
					const mapd = maps[y][x];
					setTag(mapd, map.tag);
				}
			}
			createPanels(panelNum - 1);
		};

		//ブロックの位置更新
		const drawPanels = () => {
			let num = -1;
			for (let y = 0; y < panelNum; y++) {
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y][x];
					if (map.tag !== -1 && map.tag !== num) {
						const panel = panels[map.tag];
						if (panel.x !== map.x || panel.y !== map.y) {
							timeline.create(panel).moveTo(map.x, map.y, dropTime);
						}
						num = map.tag;
					}
				}
			}
		};

		const panelNumList: number[] = [];

		const colors = ["green", "blue", "pink", "red", "orange", "gray"];
		const setTag = (map: g.FilledRect, num: number) => {
			if (num === -1) {
				map.cssColor = "black";
			} else {
				map.cssColor = "yellow";
			}
			map.modified();

			map.tag = num;
			const label = map.children[0] as g.Label;
			label.text = "" + map.tag;
			label.invalidate();
		};

		//一列ぶんのパネルの生成
		const createPanels = (y: number) => {
			//ブロックのリストを作成
			const list: number[] = [];
			list.length = 0;
			let cnt = 0;
			while (true) {
				const num = scene.random.get(1, 3);
				if (cnt + num > panelNum - 1) {
					break;
				}
				cnt += num;
				list.push(num);
			}
			list.push(cnt - panelNum);

			//シャッフル
			for (let i = list.length - 1; i > 0; i--) {
				const r = scene.random.get(0, i + 1);
				const tmp = list[i];
				list[i] = list[r];
				list[r] = tmp;
			}

			let x = 0;
			list.forEach(num => {
				if (num <= 0) {
					for (let i = 0; i < -num; i++) {
						const map = maps[y][x];
						setTag(map, -1);
						x++;
					}
				} else {
					const numP = panelNumList.pop();
					const panel = panels[numP];
					panel.x = maps[y][x].x;
					panel.y = maps[y][x].y + panelSize;
					panel.frameNumber = num - 1;
					panel.opacity = 1.0;
					panel.modified();
					panel.show();

					for (let i = 0; i < num; i++) {
						const map = maps[y][x];
						setTag(map, numP);
						x++;
					}
				}
			});
		};

		//リセット
		this.reset = () => {
			isStop = true;
			pNum = -1;
			sprMiss.hide();
			comboCnt = 1;

			for (let y = 0; y < panelNum; y++) {
				for (let x = 0; x < panelNum; x++) {
					const map = maps[y][x];
					map.opacity = 0;
					setTag(map, -1);
				}
			}

			panelNumList.length = 0;
			for (let i = 0; i < panelNum * panelNum; i++) {
				panels[i].hide();
				panelNumList.push(i);
			}

			for (let y = 5; y < panelNum; y++) {
				createPanels(y);
			}

			drop();

		};

	}
}
