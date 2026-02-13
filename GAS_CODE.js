function doPost(e) {
    try {
        // --- 設定 (ここを変更してください) ---
        var NOTIFY_EMAIL = "hmp.academy0516@gmail.com"; // 通知を受け取るメールアドレス
        var EMAIL_SUBJECT = "【HMPA】Webサイトからのお問い合わせ";
        // -------------------------------

        // 1. データのパース
        var data = JSON.parse(e.postData.contents);

        // 2. スパム対策 (ハニーポット)
        // 隠しフィールド 'honeypot' に値が入っている場合、ボットである可能性が高いです。
        if (data.honeypot && data.honeypot !== "") {
            // 成功したふりをして終了します (ボットを騙すため)
            return ContentService.createTextOutput(JSON.stringify({ success: true }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // 3. 必須項目チェック
        if (!data.name || !data.email || !data.subject || !data.message) {
            return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Missing required fields" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // 4. シートの準備
        var sheet = SpreadsheetApp.getActiveSheet();
        var date = new Date();
        var formattedDate = Utilities.formatDate(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

        // 4. 行の挿入 (上部に追加)
        // ヘッダー(1行目)の下に挿入します
        sheet.insertRowAfter(1);

        // データを列にマッピング: 日付 | 名前 | Email | 件名 | メッセージ
        sheet.getRange(2, 1, 1, 5).setValues([[
            formattedDate,
            data.name,
            data.email,
            data.subject || "", // 件名を追加
            data.message
        ]]);

        // 5. メール通知 (GmailApp)
        var mailBody = "Webサイトから新しいお問い合わせがありました。\n\n" +
            "日時: " + formattedDate + "\n" +
            "お名前: " + data.name + "\n" +
            "Email: " + data.email + "\n" +
            "件名: " + (data.subject || "なし") + "\n\n" +
            "--- メッセージ ---\n" +
            data.message + "\n" +
            "---------------";

        var options = {};
        if (data.email && data.email.indexOf("@") > -1) {
            options.replyTo = data.email; // 返信先を送信者のアドレスに設定
        }

        // メール送信
        GmailApp.sendEmail(NOTIFY_EMAIL, EMAIL_SUBJECT, mailBody, options);

        // 6. 成功レスポンスを返す (JSON)
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // エラーレスポンス
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
