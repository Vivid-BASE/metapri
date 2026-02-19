# Cloudflare Worker + Resend 完全無料コンタクトフォーム実装ガイド

## 概要
このガイドでは、Cloudflare WorkersとResend APIを使用して、完全無料・無制限のコンタクトフォームを実装する方法を説明します。

### 特徴
- ✅ **完全無料**: Cloudflare Workers（1日10万リクエスト）+ Resend（月3,000通）
- ✅ **無制限**: 実質的に件数制限なし
- ✅ **安全**: GASのようなアカウント停止リスクなし
- ✅ **カスタマイズ可能**: デザインを自由に変更可能
- ✅ **簡単**: 30分で実装完了

---

## 前提条件
- Cloudflareアカウント（無料）
- Resendアカウント（無料、クレカ不要）
- Node.js と npm がインストール済み

---

## 実装手順

### ステップ1: Resendアカウント作成

1. [Resend](https://resend.com) にアクセス
2. 「Sign Up」からアカウント作成（Gmailでも可）
3. ダッシュボードで「API Keys」→「Create API Key」
4. 名前を入力（例: `Contact Form`）、「Full Access」を選択
5. **APIキーをコピー**（一度しか表示されないので注意）

### ステップ2: Cloudflare Workerコード作成

プロジェクトディレクトリに以下のファイルを作成:

#### `worker.js`
```javascript
/**
 * Cloudflare Worker for Contact Form Submission
 * Handles form submissions and sends email notifications via Resend API
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse form data
      const formData = await request.formData();
      const name = formData.get('name');
      const email = formData.get('email');
      const subject = formData.get('subject');
      const message = formData.get('message');

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return new Response(JSON.stringify({ error: 'All fields are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Send email via Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Contact Form <onboarding@resend.dev>',
          to: [env.NOTIFICATION_EMAIL],
          subject: `[Contact Form] ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text();
        console.error('Resend API error:', errorData);
        throw new Error('Failed to send email');
      }

      // Return success response
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Error processing form submission:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
```

#### `wrangler.toml`
```toml
name = "contact-form-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

# Environment variables (secrets)
# Set these using: wrangler secret put RESEND_API_KEY
# Set these using: wrangler secret put NOTIFICATION_EMAIL
```

### ステップ3: Workerをデプロイ

```bash
# Wranglerをインストール（初回のみ）
npm install -g wrangler
# または npx を使用
npx wrangler --version

# Cloudflareにログイン
npx wrangler login

# Workerをデプロイ
npx wrangler deploy

# 環境変数を設定
echo "YOUR_RESEND_API_KEY" | npx wrangler secret put RESEND_API_KEY
echo "your-email@example.com" | npx wrangler secret put NOTIFICATION_EMAIL
```

デプロイ完了後、Worker URLが表示されます:
```
https://contact-form-worker.YOUR_SUBDOMAIN.workers.dev
```

### ステップ4: HTMLフォームを作成

```html
<!-- Contact Form Section -->
<section id="contact">
  <h2>CONTACT</h2>
  <div style="max-width: 600px; margin: 0 auto;">
    <form id="contactForm">
      <div>
        <label for="name">NAME</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div>
        <label for="email">EMAIL</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div>
        <label for="subject">SUBJECT</label>
        <input type="text" id="subject" name="subject" required>
      </div>
      <div>
        <label for="message">MESSAGE</label>
        <textarea id="message" name="message" rows="5" required></textarea>
      </div>
      <button type="submit">SEND MESSAGE</button>
      <div id="formStatus" style="display: none;"></div>
    </form>
  </div>
</section>

<script>
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Show sending status
      formStatus.textContent = 'SENDING...';
      formStatus.style.display = 'block';
      formStatus.style.color = '#fff';

      // Get form data
      const formData = new FormData(contactForm);

      try {
        // Submit to Cloudflare Worker
        const response = await fetch('https://contact-form-worker.YOUR_SUBDOMAIN.workers.dev', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // Success
          formStatus.textContent = 'MESSAGE SENT SUCCESSFULLY!';
          formStatus.style.color = '#00ff00';
          contactForm.reset();

          setTimeout(() => {
            formStatus.style.display = 'none';
          }, 5000);
        } else {
          throw new Error('Submission failed');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        formStatus.textContent = 'ERROR: Please try again';
        formStatus.style.color = '#ff0000';
        setTimeout(() => {
          formStatus.style.display = 'none';
        }, 5000);
      }
    });
  }
</script>
```

**重要**: `https://contact-form-worker.YOUR_SUBDOMAIN.workers.dev` を実際のWorker URLに置き換えてください。

---

## カスタマイズ

### メールテンプレートの変更

`worker.js` の `html` 部分を編集:

```javascript
html: `
  <h2>お問い合わせがありました</h2>
  <p><strong>お名前:</strong> ${name}</p>
  <p><strong>メールアドレス:</strong> ${email}</p>
  <p><strong>件名:</strong> ${subject}</p>
  <p><strong>メッセージ:</strong></p>
  <p>${message.replace(/\n/g, '<br>')}</p>
`,
```

### 送信元メールアドレスの変更

独自ドメインを使用する場合:

1. Resendダッシュボードで「Domains」→「Add Domain」
2. DNSレコードを設定
3. `worker.js` の `from` を変更:
```javascript
from: 'Contact Form <noreply@yourdomain.com>',
```

### フォームフィールドの追加

1. HTMLに新しいフィールドを追加:
```html
<div>
  <label for="phone">PHONE</label>
  <input type="tel" id="phone" name="phone">
</div>
```

2. `worker.js` でフィールドを取得:
```javascript
const phone = formData.get('phone');
```

3. メールテンプレートに追加:
```javascript
<p><strong>Phone:</strong> ${phone}</p>
```

---

## トラブルシューティング

### メールが届かない

1. **Resendダッシュボードを確認**
   - 「Logs」で送信履歴を確認
   - エラーメッセージがあれば確認

2. **Workerログを確認**
   ```bash
   npx wrangler tail
   ```

3. **スパムフォルダを確認**
   - 初回送信はスパムに入る可能性あり

### CORSエラーが出る

`worker.js` のCORSヘッダーを確認:
```javascript
'Access-Control-Allow-Origin': '*',
```

特定のドメインのみ許可する場合:
```javascript
'Access-Control-Allow-Origin': 'https://yourdomain.com',
```

### デプロイエラー

```bash
# ログアウトして再ログイン
npx wrangler logout
npx wrangler login

# 再デプロイ
npx wrangler deploy
```

---

## セキュリティ

### スパム対策

1. **reCAPTCHA追加**（推奨）
2. **レート制限** (Cloudflare Workersで実装可能)
3. **ハニーポット**フィールド追加

### 環境変数の管理

- **絶対にコミットしない**: APIキーやメールアドレスはGitにコミットしない
- **Wrangler Secretsを使用**: `wrangler secret put` で安全に管理

---

## コスト

### 無料枠
- **Cloudflare Workers**: 1日10万リクエスト（無料）
- **Resend**: 月3,000通（無料、クレカ不要）

### 有料プラン（必要な場合）
- **Cloudflare Workers**: $5/月で1,000万リクエスト
- **Resend**: $20/月で50,000通

---

## まとめ

このシステムは以下の利点があります:

✅ **完全無料**: 小規模サイトなら永久無料
✅ **安定性**: Cloudflareの高速インフラ
✅ **拡張性**: 簡単にカスタマイズ可能
✅ **安全性**: アカウント停止リスクなし

他のプロジェクトでも同じ手順で実装できます！
