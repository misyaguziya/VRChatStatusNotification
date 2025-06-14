# VRChat Webhook テストスイート

このディレクトリには、VRChat障害通知Webhookレシーバーのテストツールが含まれています。

## ファイル構成

```
test/
├── Test-VRChatWebhook.ps1     # メインのPowerShellテストスクリプト
├── run_test.bat               # Windows用バッチランチャー
├── config.template.ps1        # 設定ファイルのテンプレート
└── README.md                  # このファイル
```

## クイックスタート

### 1. 基本的な使用方法

```powershell
# すべてのテストを実行
.\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

# Discord形式のみテスト
.\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL" -TestType discord

# 詳細ログ付きで実行
.\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL" -Verbose
```

### 2. バッチファイルを使用

```cmd
# すべてのテストを実行
run_test.bat "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

# Discord形式のみテスト
run_test.bat "YOUR_URL" discord
```

## 詳細な使用方法

### PowerShellスクリプトの機能

**Test-VRChatWebhook.ps1** は以下の機能を提供します：

- **3つのテスト形式**:
  - `discord`: Discord Embed形式
  - `statuspage`: VRChat Status Page形式  
  - `generic`: 汎用JSON形式
  - `all`: 上記すべて（デフォルト）

- **詳細なログ出力**: リクエスト/レスポンスの詳細情報
- **エラーハンドリング**: 接続エラー、タイムアウト、HTTP エラーの処理
- **結果レポート**: 成功/失敗の統計とサマリー
- **設定可能なオプション**: タイムアウト、待機時間、ログレベル

### パラメータ詳細

| パラメータ | 必須 | デフォルト | 説明 |
|-----------|------|------------|------|
| `-WebhookUrl` | ✅ | - | テスト対象のWebhook URL |
| `-TestType` | ❌ | `all` | テストの種類 |
| `-DelaySeconds` | ❌ | `2` | テスト間の待機時間 |
| `-Verbose` | ❌ | `false` | 詳細ログの出力 |

### テストデータの内容

#### 1. Discord Embed形式
```json
{
  "embeds": [{
    "title": "🚨 VRChat Service Alert - PowerShell Test",
    "description": "We are experiencing elevated error rates...",
    "color": 16711680,
    "fields": [
      {
        "name": "📊 Status",
        "value": "Investigating",
        "inline": true
      }
    ],
    "timestamp": "2025-06-13T10:00:00.000Z",
    "url": "https://status.vrchat.com/incidents/test-1234"
  }]
}
```

#### 2. VRChat Status Page形式
```json
{
  "page": {
    "id": "vrchat-status",
    "name": "VRChat Status"
  },
  "incident": {
    "name": "Database Performance Degradation",
    "status": "monitoring",
    "impact": "minor"
  }
}
```

#### 3. 汎用形式
```json
{
  "title": "VRChat PowerShell Integration Test",
  "description": "Comprehensive test alert...",
  "severity": "Medium",
  "status": "Resolved",
  "metadata": {
    "test_id": 1234,
    "powershell_version": "5.1.19041.4648"
  }
}
```

## 設定ファイルの使用

高度な設定を行う場合は、設定ファイルを作成できます：

### 1. 設定ファイルの作成
```powershell
# テンプレートをコピー
Copy-Item config.template.ps1 config.ps1

# 設定を編集
notepad config.ps1
```

### 2. 設定ファイルの使用
```powershell
# 設定を読み込んでテスト実行
. .\config.ps1
.\Test-VRChatWebhook.ps1 -WebhookUrl $script:WEBHOOK_URL -TestType $script:DEFAULT_TEST_TYPE
```

### 3. 設定の検証
```powershell
# 設定ファイルの読み込みと検証
. .\config.ps1
Test-Configuration
Show-Configuration
```

## 結果の解釈

### 成功例
```
🚀 Starting VRChat Webhook Tests...
🔗 Target URL: https://script.google.com/macros/s/ABC123/exec

📋 Test 1/3: discord
📤 Sending Discord Embed test...
   ✅ Success (1250ms)
   📝 Response: {"status":"success","message":"Data logged successfully"}

📊 Test Results Summary
==================================================
Discord Embed       : ✅ PASS
Status Page         : ✅ PASS  
Generic Format      : ✅ PASS

📈 Total Results:
   ✅ Successful: 3
   ❌ Failed: 0
   📊 Success Rate: 100.0%

🎉 All tests passed successfully!
```

### エラー例
```
📋 Test 1/3: discord
📤 Sending Discord Embed test...
   ❌ Failed: The remote server returned an error: (404) Not Found
   📊 Status Code: 404
   📝 Response: {"error":"Script not found"}
```

## トラブルシューティング

### よくある問題

#### 1. 実行ポリシーエラー
```powershell
# 実行ポリシーを一時的に変更
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# または、直接実行時に指定
powershell -ExecutionPolicy Bypass -File Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL"
```

#### 2. SSL/TLS エラー
```powershell
# TLS 1.2 を有効化
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# または、スクリプト内で自動的に設定される
```

#### 3. プロキシ環境での実行
```powershell
# プロキシ設定（config.ps1で設定）
$script:ADVANCED_CONFIG = @{
    UseProxy = $true
    ProxyUrl = "http://proxy.company.com:8080"
}
```

#### 4. タイムアウトエラー
```powershell
# タイムアウト時間を延長
.\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL" -DelaySeconds 5
```

### エラーコード

| コード | 意味 | 対処法 |
|--------|------|--------|
| 0 | 正常終了 | - |
| 1 | 一部テスト失敗 | エラーメッセージを確認 |
| 2 | 予期しないエラー | スタックトレースを確認 |

## 高度な使用例

### 1. カスタムテストデータ
```powershell
# スクリプトを修正してカスタムペイロードを追加
# GetDiscordPayload(), GetStatusPagePayload(), GetGenericPayload() メソッドを編集
```

### 2. バッチ処理
```powershell
# 複数のURLを順次テスト
$urls = @(
    "https://script.google.com/macros/s/SCRIPT1/exec",
    "https://script.google.com/macros/s/SCRIPT2/exec"
)

foreach ($url in $urls) {
    Write-Host "Testing: $url"
    .\Test-VRChatWebhook.ps1 -WebhookUrl $url -TestType discord
}
```

### 3. スケジュール実行
```powershell
# Windows タスクスケジューラでの定期実行
# schtasks コマンドまたは PowerShell ScheduledTasks モジュールを使用
```

## ログとレポート

### 詳細レポートの生成
```powershell
# -Verbose オプションで詳細レポートを生成
.\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL" -Verbose

# 生成されるファイル: VRChatWebhook_TestReport_YYYYMMDD_HHMMSS.json
```

### ログレベルの設定
```powershell
# デバッグログの有効化
$DebugPreference = "Continue"
.\Test-VRChatWebhook.ps1 -WebhookUrl "YOUR_URL" -Debug
```

## 貢献

バグ報告や改善提案は、以下の方法でお願いします：

1. **Issues**: GitHubのIssuesでバグ報告
2. **Pull Requests**: 機能追加や修正のPR
3. **ディスカッション**: 新機能のアイデアや質問

## ライセンス

このテストスイートは、メインプロジェクトと同じMITライセンスの下で公開されています。
