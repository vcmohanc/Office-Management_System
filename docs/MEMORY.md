# Project Memory (Current State)

## 現状
- **認証**：ログイン／ユーザー登録／パスワード変更。§1-20 の権限をサーバー側でも強制している。
- **立替・精算モジュール**：要件定義書 §1-1〜§1-21 の画面と項目を実装済み。
- **バックエンド**：MongoDB + Express で実装済み。案件・処理・分割・請求控除・退職時・添付・マスタ・CSV出力・履歴すべてAPI経由。APIの一覧は [API.md](./API.md)。
- **フロントエンド**：`src/api/client.js` 経由でAPIを呼ぶ。**サーバーに接続できない場合は `constants/` のサンプルデータで表示し、画面上に「サーバーに接続できません」と表示する**（保存はされない）。
- **ルーティング**：ランディングページは廃止。`/` は未ログインなら `/login`、ログイン済みなら `/dashboard`。

## 主要ファイル
### サーバー
- `models/Case.js` — 立替案件（処理・分割・請求控除・退職時・添付・コメント・履歴を内包）
- `models/ExpenseType.js` / `Staff.js` / `HostFarmer.js` / `PostageRate.js` / `Setting.js` — マスタ
- `models/Counter.js` — ケースIDの採番カウンタ
- `constants/permissions.js` / `middleware/permissions.js` — §1-20 の権限マトリクスと強制
- `utils/caseHelpers.js` — 採番・ステータス自動判定（§1-8）・履歴追加（§1-21）
- `routes/cases.js` / `attachments.js` / `masters.js` / `exports.js` / `dashboard.js` / `auth.js`
- `seed.js` — ユーザー4種・マスタ・4パターンを網羅したサンプル案件6件

### クライアント
- `api/client.js` — API呼び出し。サーバーの `caseId` を画面の `id` に正規化する
- `hooks/useMasters.js` — 種別・スタッフ・農家・郵送費レート・分割上限をAPIから取得（失敗時は constants/ にフォールバック）
- `constants/cases.js` — サンプルデータと判定ロジック（オフライン表示用）
- `components/account/` — NewCase（登録①〜⑨）／CaseList（一覧・詳細・差戻し・取消・承認）／PaymentStatus（給与天引き・派遣先請求控除・CSV）
- `components/admin/` — 種別・スタッフ・農家・郵送費・分割上限のマスタ画面

## 命名の注意
案件の「費用負担先からの回収」フィールドは **`recovery`**。
Mongoose では `collection` が予約名（`doc.collection` がドライバのCollectionを指す）ため使えない。
クライアント側も同じ名前に揃えてある。

## 要件定義書 §1-1〜§1-21 の実装状況
**21項目すべて、API・画面とも実装済み。**

画面から行える操作：
- 案件の登録・編集（変更前/変更後が履歴に残る）・承認・差戻し・取消・保留
- 精算／回収処理の更新（案件詳細と精算・回収処理画面の両方から）
- 分割天引きの各月を完了／未処理に切り替え（天引き済み額と回収ステータスは自動再計算）
- 派遣先請求・控除の更新、退職時の給与天引きの登録・更新
- 添付書類の追加・閲覧・削除（閲覧は認証ヘッダーが要るため blob 経由で開く）
- コメント投稿、CSV出力3種、種別マスタの追加・編集・停止

ダイアログは `components/account/CaseDialogs.jsx` に集約（CaseList と PaymentStatus で共用）。

## 既知の制限 / 次のステップ
1. **マスタの追加・編集UI**：種別マスタは追加・編集・停止まで実装済み。スタッフ／派遣先・農家／郵送費は一覧表示のみで、追加・編集ボタンは未接続（APIは実装済み）。要件定義書に無い追加仕様のため優先度は低い。
2. **書類間の矛盾（未解決）**：処理パターンの番号が要件定義書とxlsxで2と3が逆。要件定義書 §13 に合わせている（`constants/patterns.js`）。新規登録の入力順も両者で異なる。
3. **旧HR機能**：`hr/` 配下の4画面は要件定義書に無い旧汎用OMSの機能。サイドバーで「参考／旧HR機能」として分離している。
4. **未使用ファイル**：`components/support/` の3ファイルと `hr/HRDashboard.jsx` はどこからも import されていない（削除候補）。
