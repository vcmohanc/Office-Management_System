# API リファレンス

ベースURL：`http://localhost:5000/api`（開発時はViteのproxy経由で `/api` にアクセスする）
認証：ログイン以外はすべて `Authorization: Bearer <token>` が必要。

## 権限（§1-20）

| 操作 | 申請者 | 内容確認者 | 経理・給与処理担当者 | システム管理者 |
| --- | :-: | :-: | :-: | :-: |
| 閲覧 | ○ | ○ | ○ | ○ |
| 新規登録 | ○ | | | ○ |
| 編集 | ○ | ○ | | ○ |
| 差戻し | | ○ | | ○ |
| 承認 | | ○ | | ○ |
| 処理状態更新 | | | ○ | ○ |
| 添付ファイル閲覧 | ○ | ○ | ○ | ○ |
| CSV出力 | | | ○ | ○ |
| 取消 | ○ | ○ | | ○ |
| マスタ管理 | | | | ○ |

権限がない操作は `403` と日本語のエラーメッセージを返す。

## 認証 `/auth`

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/auth/login` | ログイン。`{ token, user }` を返す |
| POST | `/auth/register` | ユーザー作成。**最初の1人目のみ未認証で作成可**。以降はマスタ管理権限が必要 |
| PUT | `/auth/update-password` | パスワード変更 |
| GET | `/auth/users` | ユーザー一覧（マスタ管理権限） |
| PUT | `/auth/users/:id` | ユーザー更新（マスタ管理権限） |

## 立替案件 `/cases`

| メソッド | パス | 要件 | 説明 |
| --- | --- | --- | --- |
| GET | `/cases` | §1-15 §1-16 | 一覧。クエリで絞り込む（下記） |
| GET | `/cases/:caseId` | §1-17 | 詳細 |
| POST | `/cases` | §1-1 | 登録。ケースIDは `CAS-YYYY-0001` 形式で自動採番 |
| PUT | `/cases/:caseId` | §1-17 §1-21 | 編集。変更した項目は変更前・変更後が履歴に残る |
| PUT | `/cases/:caseId/process/:leg` | §1-7 | 処理状態更新。`:leg` は `settlement`（立替者への精算）／`recovery`（費用負担先からの回収） |
| PUT | `/cases/:caseId/installments/:index` | §1-10 | 分割天引きの各月を更新。天引き済み額と回収ステータスを自動再計算 |
| GET | `/cases/:caseId/installments/check` | §1-10 | 分割金額の合計と天引き総額の一致を確認 |
| PUT | `/cases/:caseId/billing` | §1-12 | 派遣先請求・控除の更新 |
| PUT | `/cases/:caseId/resignation` | §1-11 | 退職時の給与天引き。誓約書が未添付なら `warning` を返す |
| POST | `/cases/:caseId/approve` | §1-18 | 承認（差戻しを解除し、処理の進捗からステータスを再判定） |
| POST | `/cases/:caseId/reject` | §1-18 | 差戻し。`reason` 必須 |
| POST | `/cases/:caseId/cancel` | §1-18 | 取消。`reason` 必須。**処理済み額がある案件は取消不可** |
| POST | `/cases/:caseId/status` | §1-14 | 保留などへのステータス変更 |
| POST | `/cases/:caseId/comments` | §1-17 | コメント追加 |

### 絞り込みクエリ（§1-16）
`keyword` / `type` / `typeKey` / `status` / `costBearer` / `advancer` / `from` / `to`（期間＝発生日）/
`targetStaff` / `targetHost` / `awaitingPayroll=true`（給与天引き待ち）/
`awaitingBilling=true`（派遣先請求控除待ち）/ `missingAttachment=true`（添付不足）

### ステータスの自動判定（§1-8）
`settlement` と `recovery` のうち「対象外」でないものを見て、
すべて完了なら `完了`、一方のみ完了・処理中なら `処理中`、どちらも未処理なら `未処理` になる。
`差戻し`／`保留`／`取消` は処理の進捗に関わらず維持される。

## 添付ファイル（§1-13）

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/cases/:caseId/attachments` | multipart。`files`（最大10件・各5MBまで・PDF/PNG/JPGのみ）と `kinds`（JSON配列、filesと同じ並び） |
| GET | `/cases/:caseId/attachments/:storedName` | 閲覧（添付ファイル閲覧権限） |
| DELETE | `/cases/:caseId/attachments/:storedName` | 削除 |

書類種別：領収書／レシート／配送伝票／行先証明／定額小為替／診療明細／請求書／天引き誓約書／破損・故障写真／その他
`天引き誓約書` を添付すると、退職時の給与天引き管理の「誓約書」が自動で添付済みになる。
実体は `server/uploads/` に保存する（gitignore済み）。

## マスタ `/masters`

| パス | 説明 |
| --- | --- |
| `/masters/expense-types` | §1-2 費用種別。`?enabledOnly=true` で有効なもののみ。GET/POST/PUT/DELETE |
| `/masters/staff` | サービススタッフ。GET/POST/PUT/DELETE（キーは `staffId`） |
| `/masters/host-farmers` | 派遣先・農家。GET/POST/PUT/DELETE（キーは `hostId`） |
| `/masters/postage-rates` | 郵送費レート表。GET/POST/PUT/DELETE（キーは `_id`） |
| `/masters/settings/:key` | システム設定。`installmentThreshold`（分割提案の上限金額）など。GET/PUT |

更新系はすべてマスタ管理権限が必要。

## CSV出力 `/exports`（§1-19）

| パス | 出力項目 |
| --- | --- |
| `/exports/cases` | ケースID／発生日／種別／立替者／対象／費用負担先／金額／精算方法／回収方法／処理状態 |
| `/exports/payroll` | 対象給与月／スタッフID／スタッフ名／ケースID／種別／天引き予定額／天引き済み額／残額／備考 |
| `/exports/host-billing` | 対象請求月／派遣先ID／派遣先名／ケースID／対象スタッフ／種別／請求額・控除額／処理状態／備考 |

Excelで文字化けしないようBOM付きUTF-8で返す。分割天引きは対象月ごとに1行になる。

## 集計 `/dashboard`

立替者への振込予定額・給与天引き対象額・派遣先請求控除待ち件数・添付不足件数・ステータス別件数と、直近5件の案件を返す。

## 起動方法

```bash
# 1. MongoDB を起動（Windowsサービス、または mongod --dbpath <path>）
# 2. 初期データ投入
cd server && npm install && node seed.js
# 3. APIサーバー
npm run dev          # http://localhost:5000
# 4. フロントエンド
cd ../client && npm install && npm run dev   # http://localhost:5173
```

シードで作成されるユーザー（パスワードはすべて `password123`）：
`admin`（システム管理者）／`reviewer_user`（内容確認者）／`accounting_user`（経理・給与処理担当者）／`applicant_user`（申請者）
