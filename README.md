# 個人多功能工具箱（iPhone PWA）

繁體中文、手機優先、純前端。無需 Windows 本機伺服器或雲端資料庫。

## 第一版功能

單位換算、日期計算、折扣計算、文字統計、分貝能量合成與安全密碼產生器；另有工具收藏、最近使用、明暗主題、本機設定匯出／匯入以及 Service Worker 離線快取。

## GitHub Pages 部署

在 Repository → Settings → Pages → Build and deployment 中選取 **Deploy from a branch**，使用 `main` 與 `/(root)`，儲存後造訪 `https://josephho410-glitch.github.io/personal-toolbox/`。

iPhone 使用 Safari 開啟網址，再透過分享選單選取「加入主畫面」。需要 HTTPS 才能正常使用 Service Worker 離線快取。首次下載須連網。

## 測試

`node --test tests/core.test.mjs`、`node --check app.js`

## 資料隱私

所有計算在裝置瀏覽器完成，不會將輸入的數值傳送到後端；收藏與主題設定儲存在裝置 localStorage，可從設定頁匯出備份。Safari 可能清理網站資料，請妥善保存設定備份。

工程模組的分貝合成為非相干聲源能量合成，不是 Leq 時間平均或法規合格判定。
