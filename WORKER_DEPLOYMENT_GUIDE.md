# Cloudflare Worker デプロイガイド

## 前提条件
- Cloudflareアカウント
- Node.js と npm がインストール済み
- Resend APIキー取得済み

## デプロイ手順

### 1. Wranglerのインストール
```bash
npm install -g wrangler
```

### 2. Cloudflareにログイン
```bash
wrangler login
```
ブラウザが開くので、Cloudflareアカウントでログインしてください。

### 3. Workerをデプロイ
```bash
cd /Users/show/AI/metapri3
wrangler deploy
```

### 4. 環境変数（シークレット）を設定

#### Resend APIキーを設定
```bash
wrangler secret put RESEND_API_KEY
```
プロンプトが表示されたら、以下を入力:
```
re_fu7Eh9V8_2r1U5zUohPn4TPqzSTQztcxU
```

#### 通知先メールアドレスを設定
```bash
wrangler secret put NOTIFICATION_EMAIL
```
プロンプトが表示されたら、以下を入力:
```
hmp.academy0516@gmail.com
```

### 5. Worker URLを確認
デプロイ完了後、以下のようなURLが表示されます:
```
https://contact-form-worker.<YOUR_SUBDOMAIN>.workers.dev
```

このURLをコピーしてください。

## 次のステップ
1. Worker URLを取得
2. `index.html` のフォームの `action` をWorker URLに変更
3. テスト送信

## トラブルシューティング

### エラー: "Authentication error"
```bash
wrangler logout
wrangler login
```

### エラー: "Failed to publish"
Cloudflareダッシュボードで Workers が有効になっているか確認してください。

### メールが届かない
1. Resend ダッシュボードで送信ログを確認
2. Worker のログを確認: `wrangler tail`
