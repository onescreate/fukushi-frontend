# Phase 1 実装計画 — マスタ管理＋権限

> 作成日: 2026-07-02 / 前提: Phase 0 完了（認証・DB・UI土台）
> 進め方: 各ステップごとに確認しながら実装。1ステップ完了→動作確認→次へ。

## このPhaseのゴール

「**法人→店舗→職員→利用者のマスタを、権限に応じて安全に管理できる**」状態。
あわせて、Phase 0 で保留した**サーバー側の権限強制（Tenant/RBAC）**をここで実装し、以降の全機能の安全な基盤にする。

完成時にできること:
- サーバーが「誰がどのデータを操作できるか」を強制（他法人・他店舗のデータは触れない）
- 管理画面で 法人 / 店舗 / 職員 / 利用者 を登録・編集・削除
- 職員・利用者の**アカウント発行**（Firebase連携）と、**タブレット端末登録＋PIN打刻認証**

---

## ステップ分割

### Step 1-0｜権限の土台（Tenant/RBAC Guard）※Phase 0の0-5
- **RbacGuard**: `@RequirePermission('...')` で必要権限を宣言 → principalの権限集合で判定。
- **TenantGuard**: アクセス対象の法人/店舗が、principalのスコープ内かをサーバーで検証（クライアント送信値は信用しない）。
- ロール→権限のマッピングを定義（設計書5.2）。
- AuthGuardを全体適用にし、`@Public()`（health/kiosk等）だけ除外。
- 動作確認: 権限のあるトークンは200、無いトークンは403。他店舗指定は403。

### Step 1-1｜管理画面レイアウト（フロント）
- 認証済みレイアウト（サイドバー＋ヘッダー）。メニューは**権限で出し分け**。
- マスタ画面用のルーティング構造。
- 共通のデータテーブル表示パターン（shadcnのtable＋TanStack Query）。

### Step 1-2｜法人マスタ（system_admin）
- バック: `corporations` のCRUD（module/service/controller/DTO＋RBAC）。
- フロント: 一覧＋作成/編集（モーダル）＋削除（ConfirmDialog）。
- 権限: system_admin のみ。

### Step 1-3｜店舗マスタ
- バック: `facilities` のCRUD（法人スコープ、`service_type` 含む）。
- フロント: 同上のパターン。
- 権限: system_admin / corporation_admin。

### Step 1-4｜職員マスタ＋アカウント発行
- バック: `staff` のCRUD＋`staff_facility_roles`（店舗×ロール割当）。
  - 作成時: Firebase Admin SDK で職員のFirebaseユーザーを作成 → `firebaseUid` を紐付け。
- フロント: 職員一覧・登録（所属店舗とロールを指定）。
- 権限: system_admin / corporation_admin /（自店舗のみ）facility_admin。

### Step 1-5｜利用者マスタ＋アカウント発行
- バック: `users` のCRUD。作成時に **合成メールのFirebaseユーザー**＋**PIN(bcrypt)** を発行。
  - `cert_number`（受給者証番号）, `special_meal_fee`, `height_cm` 等も管理。
- フロント: 利用者一覧・登録・編集。
- 権限: facility_admin / corporation_admin / system_admin。

### Step 1-6｜タブレット端末登録＋PIN打刻認証
- バック: `kiosk_devices` の登録（管理者）。`POST /kiosk/authenticate`（device_token＋利用者＋PIN → 操作トークン発行）。
- フロント: タブレット用の簡易画面（端末セットアップ＋PINパッド）。
- ※ 実際の「打刻」ロジックは Phase 2。ここでは**PIN認証が通ることまで**。

---

## この Phase で決める必要がある事項（該当ステップの直前に確認）

1. **合成メールのドメイン**（Step 1-5）: 利用者Firebase用 `{login_id}@____`。
   例: `users.fukushi.local`（実在ドメイン不要・内部用）など。→ 要決定。
2. **アカウント発行方法**（Step 1-4 / 1-5）:
   - (A) 管理者が初期パスワードを設定（画面に一度だけ表示）※推奨・シンプル
   - (B) 招待/パスワード設定メールを送る（職員は実メールがある想定）
   → 職員=どちらか、利用者=(A)想定。要確認。
3. **ロール別の操作範囲の細部**（Step 1-0）: 権限マトリクス（設計書5.2）をベースに確定。
4. **利用者のログインID体系**（Step 1-5）: 受給者証番号 or 施設発行の連番。

---

## 進め方の確認
- Step 1-0（権限の土台）から着手。各ステップ完了時に報告し、確認を得てから次へ。
- 上記「決める事項」は、該当ステップの直前に1つずつ相談して確定する。

**この計画でよければ Step 1-0（権限の土台）から始めます。**
