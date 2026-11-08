# blusque.github.io

个人主页（纯静态 HTML/CSS/JS，极简黑白风）。

## 结构

```
├── index.html        落地页
├── academic.html     学术
├── demo.html         demo（项目）
├── story/            故事（摄影作品展，独立全屏页）
├── film.html         时·光（微电影）
├── poetry.html       诗
├── media/            微电影等媒体文件
└── assets/
    └── site.css      主页共享样式
```

## 本地预览

任意静态服务器即可，例如：

```bash
cd blusque.github.io
python3 -m http.server 8000
# 打开 http://localhost:8000
```

> 注意：「故事」页的动态取色需要 `http://` 访问；直接双击 `file://` 打开会用 `data.js` 里的兜底配色，功能不受影响。

## 修改内容

- 名字 / 一句话介绍：改 `index.html`。
- 生活 / 学术 / demo / 诗 的具体内容：改对应 `.html`（页面里标了 `TODO`）。
- 故事的照片、分组、文案、配色：改 `story/data.js`。

## 部署（GitHub Pages）

仓库名 `blusque.github.io`，推到 `main` 分支即自动发布到 <https://blusque.github.io>。

```bash
git add -A
git commit -m "rebuild homepage"
git push origin main
```

> 若本地仓库历史与远端（旧的 academicpages 模板）不一致，首次需 `git push --force`。
