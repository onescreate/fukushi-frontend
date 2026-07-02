# fukushi-frontend

就労支援施設 利用者管理システムの **フロントエンド**（React + Vite + TypeScript）。

- 設計ドキュメント: [`docs/`](./docs)
- UI: Tailwind CSS 4 + shadcn/ui / 認証: Firebase / サーバー状態: TanStack Query
- デプロイ先: Vercel

## 必要なもの
- Node.js 24 系

## セットアップ
```bash
npm install

# 環境変数（Firebase Web設定・APIのURL）
cp .env.example .env   # VITE_* を設定
```

## 開発
```bash
npm run dev         # 開発サーバー（http://localhost:5173）
npm run typecheck   # 型チェック
npm run build       # ビルド
```

※ バックエンド（`../fukushi-backend`）を `http://localhost:8080` で起動しておくこと。

## メモ
- `.env` はコミットしない（`.env.example` を参照）。Firebase Web設定は公開情報だが管理は env に集約。
- 共通UI部品は `src/components/ui/`。ネイティブの `select`/`alert`/`confirm` は使わず統一部品を使う。
