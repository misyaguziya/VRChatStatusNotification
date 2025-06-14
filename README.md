# VRChat Status Notification

VRChat Statusやその他のサービスから送信されるwebhookの情報をGoogle Apps Scriptのアプリケーションで受信し、Googleスプレッドシートへの記録とDiscordへの通知を行うツールです。

## 機能

- 🔄 **多形式Webhook受信**: StatusPage Component Update・Incident Update、Discord Embed、汎用JSON形式に対応
- 📊 **自動データ変換**: 受信した各種形式のwebhookを統一フォーマットに変換
- 📋 **スプレッドシート記録**: 受信した情報を詳細な構造でGoogleスプレッドシートに自動保存
- 🔔 **Discord通知転送**: 受信した情報をDiscordチャンネルに転送通知（オプション）
- 🎨 **重要度別色分け**: インシデントの重要度に応じたスプレッドシートの視覚的な表示
- 📈 **統計機能**: Webhook受信の統計情報を生成・管理

## 対応Webhook形式

| 形式 | 説明 | 主な用途 | 検出条件 |
|------|------|----------|----------|
| StatusPage Component Update | コンポーネントステータス変更通知 | サービス状態の変更監視 | `component_update`と`component`が存在 |
| StatusPage Incident Update | インシデント更新・作成通知 | 障害・メンテナンス情報管理 | `incident`が存在 |
| Discord Embed | Discord Webhook形式 | Discord連携、カスタム通知 | `embeds`配列が存在 |
| Generic | 汎用JSON形式 | 任意のサービスからの通知 | 上記以外の任意のJSON |

## プロジェクト構成

```
VRChatStatusNotification/
├── src/
│   ├── main.gs           # メインエントリーポイント（doPost関数、webhook受信・データ変換処理）
│   └── spreadsheet.gs    # スプレッドシート管理・書式設定・統計機能
├── test/
│   ├── Test-VRChatWebhook.ps1  # PowerShell テストスイート（複数形式対応）
│   ├── run_test.bat      # テスト実行用バッチファイル（Windows）
│   ├── run_test.sh       # テスト実行用シェルスクリプト（Linux/Mac）
│   ├── config.template.ps1     # PowerShell設定テンプレート
│   └── README.md         # テストスイート詳細説明
├── appsscript.json       # Google Apps Script プロジェクト設定
└── README.md            # このファイル
```

## セットアップ手順

### 1. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/) にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「VRChat Status Notification」に変更

### 2. ファイルのアップロード

1. デフォルトの`Code.gs`を削除
2. 各ファイル（`main.gs`, `spreadsheet.gs`）を作成
3. 対応するコードをコピー&ペースト
4. `appsscript.json`の内容を設定に反映

### 3. Google スプレッドシートの準備

1. 新しいGoogle スプレッドシートを作成
2. スプレッドシートのIDをコピー（URLの`/d/`と`/edit`の間の文字列）

### 4. スクリプトプロパティの設定

Apps Scriptエディタで以下を設定：

1. ⚙️（設定）→「スクリプト プロパティ」
2. 以下のプロパティを追加：

| プロパティ名 | 値 | 説明 |
|------------|----|----- |
| `SPREADSHEET_ID` | スプレッドシートID | 記録先スプレッドシートのID（必須） |
| `DISCORD_WEBHOOK_URL` | WebhookURL | Discord転送通知用URL（任意） |
| `ENABLE_DISCORD_NOTIFICATION` | true/false | Discord通知の有効/無効（デフォルト: false） |

### 5. Webアプリとしてデプロイ

1. 「デプロイ」→「新しいデプロイ」
2. 種類：「ウェブアプリ」
3. 説明：「VRChat Status Notification」
4. 実行ユーザー：「自分」
5. アクセスできるユーザー：「全員」
6. 「デプロイ」をクリック
7. **WebアプリのURLをコピー** ← これがWebhook URLになります

## 使用方法

### Webhook URLの設定

デプロイ後に取得したWebアプリURLを、各サービスのWebhook URLとして設定してください。

例：`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

**対応サービス例:**

- VRChat Status Page
- Atlassian Statuspage
- Discord Webhook
- その他のJSON形式webhook対応サービス

### サポートしているPOSTデータ形式

#### 1. StatusPage Component Update形式

```json
{
  "component_update": {
    "id": "update_123",
    "old_status": "operational",
    "new_status": "degraded_performance",
    "created_at": "2024-01-01T12:00:00Z"
  },
  "component": {
    "id": "comp_123",
    "name": "VRChat Website",
    "created_at": "2024-01-01T10:00:00Z"
  },
  "page": {
    "id": "page_123",
    "status_indicator": "minor",
    "status_description": "Minor Service Outage"
  }
}
```

#### 2. StatusPage Incident Update形式

```json
{
  "incident": {
    "id": "incident_123",
    "name": "Authentication Service Issues",
    "status": "investigating",
    "impact": "major",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:30:00Z",
    "shortlink": "https://status.vrchat.com/incidents/123",
    "incident_updates": [{
      "body": "We are investigating reports of authentication issues.",
      "created_at": "2024-01-01T12:30:00Z"
    }],
    "components": [{
      "id": "comp_123",
      "name": "Authentication Service"
    }]
  },
  "page": {
    "id": "page_123",
    "status_indicator": "major",
    "status_description": "Major Service Outage"
  }
}
```

#### 3. Discord Embed形式

```json
{
  "embeds": [{
    "title": "VRChat Service Issue",
    "description": "Authentication service is experiencing issues",
    "color": 16711680,
    "timestamp": "2024-01-01T12:00:00Z",
    "url": "https://status.vrchat.com/incidents/example",
    "author": {
      "name": "VRChat Status"
    },
    "fields": [
      {
        "name": "Impact",
        "value": "Major",
        "inline": true
      }
    ]
  }]
}
```

#### 4. 汎用形式

```json
{
  "title": "VRChat Issue",
  "description": "Service disruption detected",
  "timestamp": "2024-01-01T12:00:00Z",
  "url": "https://example.com",
  "source": "Monitoring System"
}
```

### テストスイート

付属のPowerShellテストスイートを使用してWebhook動作を検証できます：

```powershell
# 全ての形式をテスト
.\test\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_WEBHOOK_URL"

# 特定の形式のみテスト（StatusPage Component Update/Incident Update）
.\test\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_WEBHOOK_URL" -TestType "statuspage"

# Discord Embed形式のみテスト
.\test\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_WEBHOOK_URL" -TestType "discord"
```

詳細は`test/README.md`を参照してください。

### 手動テスト

Apps Scriptエディタで以下の関数を実行してテストできます：

```javascript
// スプレッドシートの初期化
initializeSpreadsheet();

// 設定の確認
testSpreadsheetSetup();

// 受信統計の確認
getWeeklyStats();
```

## スプレッドシート構造

多様なWebhook形式に対応した詳細な列構成：

| 列 | 内容 | 説明 |
|----|------|------|
| A | Timestamp | Webhook受信時刻 |
| B | ID | 一意識別子（自動生成またはWebhookデータから抽出） |
| C | Type | データ形式（component_update/incident_update/discord_embed/generic） |
| D | Source | データソース（StatusPage Component/StatusPage Incident/Discord/Generic） |
| E | Title | 通知のタイトル |
| F | Description | 詳細説明 |
| G | Severity | 重要度（Critical/Major/Minor/Info/Maintenance） |
| H | Status | ステータス（Investigating/Resolved/Operational等） |
| I | Affected Components | 影響を受けるコンポーネント |
| J | URL | 関連リンク（StatusPageのインシデントページ等） |
| K | Page ID | StatusPageのページID |
| L | Page Status | StatusPageのページステータス説明 |
| M | Component/Incident ID | コンポーネントまたはインシデントID |
| N | Component/Incident Name | コンポーネントまたはインシデント名 |
| O | Old Status | 古いステータス（Component Update時のみ） |
| P | New/Current Status | 新しい/現在のステータス |
| Q | Impact | インシデントの影響度（StatusPage Incident時） |
| R | Created At | 作成日時 |
| S | Updated At | 更新日時 |
| T | Resolved At | 解決日時 |
| U | Fields | 追加フィールド情報（JSON形式） |
| V | Footer | フッター情報 |
| W | Raw Data | 受信した元のJSONデータ |

## レスポンス形式

Webhook受信時のレスポンス：

### 成功時（HTTP 200）

```json
{
  "status": "success",
  "message": "Data logged successfully",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data_type": "component_update",
  "id": "update_123"
}
```

### エラー時（HTTP 500）

```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## トラブルシューティング

### エラー: "SPREADSHEET_ID not configured"

- スクリプトプロパティで`SPREADSHEET_ID`が設定されているか確認してください

### エラー: "Permission denied"

- Apps Scriptがスプレッドシートにアクセスする権限があるか確認
- スプレッドシートの共有設定を確認してください

### Discord通知が送信されない

**設定確認手順：**

1. **Google Apps Scriptエディタで設定確認関数を実行**

   ```javascript
   // 関数一覧から「checkConfiguration」を選択して実行
   checkConfiguration()
   ```

2. **必要な設定項目を確認**
   - `DISCORD_WEBHOOK_URL`: DiscordのWebhook URL
   - `ENABLE_DISCORD_NOTIFICATION`: `true`に設定

3. **Discord通知のテスト実行**

   ```javascript
   // 関数一覧から「testDiscordNotification」を選択して実行
   testDiscordNotification()
   ```

**よくある問題と解決方法：**

- ❌ `ENABLE_DISCORD_NOTIFICATION`が設定されていない
  - → スクリプトプロパティで`true`に設定
- ❌ Discord Webhook URLが無効
  - → Discordサーバー設定で新しいWebhookを作成
- ❌ Google Apps ScriptのURLアクセス権限エラー
  - → スクリプトの承認が必要（初回実行時）

**デバッグのためのログ確認：**

Google Apps Scriptエディタの「実行数」から以下のようなログメッセージを確認：

```log
Discord notification enabled: true/false
Discord webhook URL found, preparing notification...
Discord notification sent successfully
```

### Webhookが受信されない

- WebアプリのURLが正しく設定されているか確認
- デプロイ時に「アクセスできるユーザー」が「全員」になっているか確認
- 送信元サービスのWebhook設定でURLが正しく入力されているか確認
- Google Apps Scriptの実行ログでエラーが発生していないか確認

### スプレッドシートにデータが記録されない

- スクリプトの実行ログ（Google Apps Script エディタの「実行数」）でエラーを確認
- スプレッドシートの権限設定を確認
- `initializeSpreadsheet()`関数を実行してスプレッドシートを初期化
- `testSpreadsheetSetup()`関数で設定状況を確認

### 受信したデータが期待と異なる

- `Raw Data`列で受信した元のJSONデータを確認
- テストスイート（`Test-VRChatWebhook.ps1`）で各形式のサンプルデータを送信
- Google Apps Scriptの実行ログで変換プロセスを確認

## セキュリティ考慮事項

- Webhook URLは外部に公開されるため、機密情報は含めないでください
- 必要に応じて、送信元IPアドレスの検証を追加してください
- Googleスプレッドシートの共有設定を適切に管理してください
- Google Apps Scriptの実行権限を定期的に確認してください
- Discord Webhook URLは機密情報として適切に管理してください

## 使用可能な関数

Google Apps Scriptエディタから手動実行できる管理関数：

| 関数名 | 機能 | 用途 |
|--------|------|------|
| `initializeSpreadsheet()` | スプレッドシートの初期化 | 初回セットアップ時 |
| `testSpreadsheetSetup()` | 設定状況の確認 | 設定の動作確認 |
| `checkConfiguration()` | 全設定項目の確認 | トラブルシューティング |
| `testDiscordNotification()` | Discord通知のテスト | Discord連携の確認 |
| `getWeeklyStats()` | 週間統計の取得 | 受信状況の分析 |

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告や機能追加の提案は、GitHubのIssueでお願いします。

## 更新履歴

- **v2.1**: StatusPage Component Update/Incident Update完全対応、テストスイート拡張
- **v2.0**: 多形式Webhook対応、統一データ変換機能追加
- **v1.5**: Discord Embed形式サポート追加、Discord転送通知機能
- **v1.0**: 初期リリース（汎用Webhook受信機能）