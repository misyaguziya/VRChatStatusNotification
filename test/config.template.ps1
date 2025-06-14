# VRChat Webhook テスト設定ファイル
# このファイルをコピーして config.ps1 として保存し、実際の値を設定してください

# Google Apps Script の Webhook URL
# デプロイ後に取得できる URL を設定
$script:WEBHOOK_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec"

# デフォルトのテストタイプ
# 使用可能な値: discord, statuspage, generic, all
$script:DEFAULT_TEST_TYPE = "all"

# テスト間の待機時間（秒）
$script:DEFAULT_DELAY_SECONDS = 2

# 詳細ログの出力を有効にするか
$script:ENABLE_VERBOSE_LOGGING = $true

# テストレポートの保存先ディレクトリ
$script:REPORT_DIRECTORY = ".\reports"

# タイムアウト時間（秒）
$script:REQUEST_TIMEOUT_SECONDS = 30

# リトライ設定
$script:MAX_RETRY_COUNT = 3
$script:RETRY_DELAY_SECONDS = 5

# カスタムヘッダー（必要に応じて）
$script:CUSTOM_HEADERS = @{
    "User-Agent" = "VRChat-Webhook-Tester-PowerShell/1.0"
    "X-Test-Environment" = "Development"
    # "Authorization" = "Bearer YOUR_TOKEN_HERE"  # 必要に応じてコメントアウト
}

# Discord Embed のカスタマイズ設定
$script:DISCORD_CONFIG = @{
    DefaultColor = 16711680  # Red
    AuthorName = "VRChat Engineering"
    AuthorIconUrl = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
    FooterText = "VRChat Status System • PowerShell Test"
    ThumbnailUrl = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
}

# Status Page のカスタマイズ設定
$script:STATUSPAGE_CONFIG = @{
    DefaultImpact = "minor"  # critical, major, minor, maintenance
    DefaultStatus = "monitoring"  # investigating, identified, monitoring, resolved
    PageUrl = "https://status.vrchat.com"
    ComponentName = "Database Services"
}

# Generic Payload のカスタマイズ設定
$script:GENERIC_CONFIG = @{
    DefaultSeverity = "Medium"  # Low, Medium, High, Critical
    DefaultStatus = "Resolved"  # Open, Investigating, Resolved, Closed
    DefaultCategory = "Infrastructure"
    Environment = "Testing"
    Version = "1.0.0"
}

# 高度な設定
$script:ADVANCED_CONFIG = @{
    # SSL証明書の検証を無効にする（テスト環境のみ）
    SkipSSLValidation = $false
    
    # プロキシ設定（必要に応じて）
    UseProxy = $false
    ProxyUrl = "http://proxy.example.com:8080"
    ProxyCredentials = $null
    
    # ログレベル設定
    LogLevel = "Info"  # Debug, Info, Warning, Error
    
    # 並行実行の有効化
    EnableParallelExecution = $false
    
    # 結果の自動保存
    AutoSaveResults = $true
    
    # テスト実行前の確認
    RequireConfirmation = $false
}

# 設定検証関数
function Test-Configuration {
    param()
    
    $issues = @()
    
    # 必須設定のチェック
    if ($script:WEBHOOK_URL -eq "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec") {
        $issues += "WEBHOOK_URL が設定されていません"
    }
    
    if ($script:WEBHOOK_URL -notmatch "^https://script\.google\.com/macros/s/[a-zA-Z0-9_-]+/exec$") {
        $issues += "WEBHOOK_URL の形式が正しくありません"
    }
    
    if ($script:DEFAULT_TEST_TYPE -notin @("discord", "statuspage", "generic", "all")) {
        $issues += "DEFAULT_TEST_TYPE の値が無効です"
    }
    
    if ($script:DEFAULT_DELAY_SECONDS -lt 0 -or $script:DEFAULT_DELAY_SECONDS -gt 60) {
        $issues += "DEFAULT_DELAY_SECONDS の値が範囲外です（0-60秒）"
    }
    
    if ($script:REQUEST_TIMEOUT_SECONDS -lt 5 -or $script:REQUEST_TIMEOUT_SECONDS -gt 300) {
        $issues += "REQUEST_TIMEOUT_SECONDS の値が範囲外です（5-300秒）"
    }
    
    # レポートディレクトリの作成
    if ($script:REPORT_DIRECTORY -and -not (Test-Path $script:REPORT_DIRECTORY)) {
        try {
            New-Item -ItemType Directory -Path $script:REPORT_DIRECTORY -Force | Out-Null
            Write-Host "レポートディレクトリを作成しました: $script:REPORT_DIRECTORY" -ForegroundColor Green
        }
        catch {
            $issues += "レポートディレクトリの作成に失敗しました: $script:REPORT_DIRECTORY"
        }
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "❌ 設定に問題があります:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor Yellow
        }
        return $false
    }
    else {
        Write-Host "✅ 設定の検証が完了しました" -ForegroundColor Green
        return $true
    }
}

# 設定情報の表示
function Show-Configuration {
    param()
    
    Write-Host "📋 現在の設定:" -ForegroundColor Cyan
    Write-Host "  Webhook URL: $script:WEBHOOK_URL" -ForegroundColor White
    Write-Host "  Default Test Type: $script:DEFAULT_TEST_TYPE" -ForegroundColor White
    Write-Host "  Delay Seconds: $script:DEFAULT_DELAY_SECONDS" -ForegroundColor White
    Write-Host "  Verbose Logging: $script:ENABLE_VERBOSE_LOGGING" -ForegroundColor White
    Write-Host "  Report Directory: $script:REPORT_DIRECTORY" -ForegroundColor White
    Write-Host "  Request Timeout: $script:REQUEST_TIMEOUT_SECONDS seconds" -ForegroundColor White
    Write-Host ""
}

# 使用例の表示
function Show-Usage {
    param()
    
    Write-Host "📖 使用方法:" -ForegroundColor Magenta
    Write-Host "  1. このファイルを config.ps1 としてコピー" -ForegroundColor White
    Write-Host "  2. WEBHOOK_URL を実際の値に変更" -ForegroundColor White
    Write-Host "  3. 必要に応じて他の設定を調整" -ForegroundColor White
    Write-Host "  4. Test-VRChatWebhook.ps1 から設定を読み込み" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 設定テスト:" -ForegroundColor Magenta
    Write-Host "  . .\config.ps1; Test-Configuration" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 設定表示:" -ForegroundColor Magenta
    Write-Host "  . .\config.ps1; Show-Configuration" -ForegroundColor Gray
    Write-Host ""
}

# このファイルが直接実行された場合の処理
if ($MyInvocation.InvocationName -eq $MyInvocation.MyCommand.Name) {
    Write-Host "🔧 VRChat Webhook テスト設定ファイル" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host ""
    
    Show-Usage
    Show-Configuration
    Test-Configuration
}
