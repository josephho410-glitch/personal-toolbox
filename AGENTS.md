# Codex 專案規則

這是 GitHub Pages 上的繁體中文 iPhone PWA，純前端、無伺服器。優先手機點按操作。

- 先檢查現有檔案與工作流程，再提修改計畫。
- 不加入私有個資、Token、密碼或敏感資料。
- 不覆蓋使用者原始檔；設定儲存在 localStorage，匯入匯出採 JSON。
- 修改 JavaScript 後執行 Node.js 單元測試與語法檢查。
- 修改離線資源後更新 sw.js 的 CACHE 版本。
- GitHub Pages 使用相對路徑，避免寫死站台根網址。
- 需要修改正式公開頁面時先檢查 git diff，再做小範圍變更。
- 不自動 commit / push，除非使用者明確授權。
- 測試結果要區分已驗證與未在 iPhone 實機驗證。
