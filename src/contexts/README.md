# `src/contexts/` — React Context

| 檔案 | 用途 |
|---|---|
| `ThemeContext.tsx` | 明/暗主題切換（於 `<html>` 加 `.dark` class） |
| `LanguageContext.tsx` | 中/英語言切換（i18n） |

兩者於根 layout 包住整個 app，全站可透過 `useTheme()` / `useLang()` 取用。
