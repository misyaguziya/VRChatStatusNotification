#Requires -Version 5.1

<#
.SYNOPSIS
    VRChat Webhook テスト用 PowerShell スクリプト

.DESCRIPTION
    Google Apps Script で作成した VRChat 障害通知 Webhook レシーバーの動作を検証するためのテストスクリプトです。
    Discord Embed、VRChat Status Page、汎用形式の3つの形式でテストデータを送信できます。

.PARAMETER WebhookUrl
    テスト対象の Webhook URL（必須）

.PARAMETER TestType
    テストの種類を指定 (discord, statuspage, generic, all)
    デフォルト: all

.PARAMETER Verbose
    詳細なログを出力

.PARAMETER DelaySeconds
    テスト間の待機時間（秒）
    デフォルト: 2

.EXAMPLE
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    
.EXAMPLE
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" -TestType discord
    
.EXAMPLE
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" -TestType all -Verbose
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$WebhookUrl,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet("discord", "statuspage", "generic", "all")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory = $false)]
    [int]$DelaySeconds = 2
)

# 色付きログ出力用関数
function Write-ColorLog {
    param(
        [string]$Message,
        [ConsoleColor]$Color = [ConsoleColor]::White,
        [string]$Prefix = ""
    )
    
    if ($Prefix) {
        Write-Host "$Prefix " -ForegroundColor $Color -NoNewline
        Write-Host $Message
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

# テスト結果を格納するクラス
class TestResult {
    [string]$TestName
    [bool]$Success
    [int]$StatusCode
    [string]$Response
    [string]$ErrorMessage
    [DateTime]$Timestamp
    
    TestResult([string]$testName) {
        $this.TestName = $testName
        $this.Timestamp = Get-Date
        $this.Success = $false
        $this.StatusCode = 0
        $this.Response = ""
        $this.ErrorMessage = ""
    }
}

# VRChat Webhook テスタークラス
class VRChatWebhookTester {
    [string]$WebhookUrl
    [System.Collections.Generic.List[TestResult]]$Results
    [int]$DelaySeconds
    
    VRChatWebhookTester([string]$webhookUrl, [int]$delaySeconds) {
        $this.WebhookUrl = $webhookUrl
        $this.DelaySeconds = $delaySeconds
        $this.Results = [System.Collections.Generic.List[TestResult]]::new()
    }
    
    # Discord Embed形式のテストデータを生成
    [hashtable] GetDiscordPayload() {
        $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $testId = Get-Random -Minimum 1000 -Maximum 9999
        
        return @{
            embeds = @(
                @{
                    title = "🚨 VRChat Service Alert - PowerShell Test"
                    description = "We are experiencing elevated error rates on our authentication services. Users may experience login difficulties."
                    color = 16711680  # Red
                    fields = @(
                        @{
                            name = "📊 Status"
                            value = "Investigating"
                            inline = $true
                        },
                        @{
                            name = "🔧 Affected Services"
                            value = "Login, Friends, Invites"
                            inline = $true
                        },
                        @{
                            name = "📈 Impact Level"
                            value = "Major"
                            inline = $true
                        },
                        @{
                            name = "🕐 Started At"
                            value = "<t:$([DateTimeOffset]::Now.ToUnixTimeSeconds()):R>"
                            inline = $true
                        },
                        @{
                            name = "🏷️ Test ID"
                            value = "PS-$testId"
                            inline = $true
                        }
                    )
                    footer = @{
                        text = "VRChat Status System • PowerShell Test"
                        icon_url = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
                    }
                    timestamp = $timestamp
                    url = "https://status.vrchat.com/incidents/powershell-test-$testId"
                    author = @{
                        name = "VRChat Engineering"
                        icon_url = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
                    }
                    thumbnail = @{
                        url = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
                    }
                }
            )
            username = "VRChat Status Bot"
            avatar_url = "https://assets.vrchat.com/www/brand/vrchat-logo-white-transparent-crop-background.png"
        }
    }
    
    # VRChat Status Page形式のテストデータを生成
    [hashtable] GetStatusPagePayload() {
        $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $testId = Get-Random -Minimum 1000 -Maximum 9999
        
        return @{
            page = @{
                id = "vrchat-status"
                name = "VRChat Status"
                url = "https://status.vrchat.com"
                status_page = @{
                    url = "https://status.vrchat.com"
                }
            }
            incident = @{
                id = "incident-powershell-$testId"
                name = "Database Performance Degradation"
                status = "monitoring"
                created_at = $timestamp
                updated_at = $timestamp
                monitoring_at = $null
                resolved_at = $null
                impact = "minor"
                shortlink = "https://stspg.io/ps$testId"
                postmortem_body = ""
                postmortem_body_last_updated_at = $null
                postmortem_ignored = $false
                postmortem_notified_subscribers = $false
                postmortem_notified_twitter = $false
                postmortem_published_at = $null
                incident_updates = @(
                    @{
                        id = "update-$testId"
                        status = "monitoring"
                        body = "We have implemented a fix and are monitoring the situation. Database performance has returned to normal levels."
                        incident_id = "incident-powershell-$testId"
                        created_at = $timestamp
                        updated_at = $timestamp
                        display_at = $timestamp
                        affected_components = @(
                            @{
                                code = "database-cluster"
                                name = "Database Services"
                                old_status = "degraded_performance"
                                new_status = "operational"
                            }
                        )
                    }
                )
                components = @(
                    @{
                        id = "database-cluster"
                        name = "Database Services"
                        status = "operational"
                        created_at = $timestamp
                        updated_at = $timestamp
                        position = 1
                        description = "Primary database cluster"
                        showcase = $false
                        start_date = $null
                        group_id = $null
                        page_id = "vrchat-status"
                        group = $false
                        only_show_if_degraded = $false
                    }
                )
            }
            component = @{
                id = "database-cluster"
                name = "Database Services"
                status = "operational"
                created_at = $timestamp
                updated_at = $timestamp
            }
            meta = @{
                generated_at = $timestamp
                test_source = "PowerShell"
                test_id = $testId
            }
        }
    }
    
    # 汎用形式のテストデータを生成
    [hashtable] GetGenericPayload() {
        $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $testId = Get-Random -Minimum 1000 -Maximum 9999
          return @{
            title = "VRChat PowerShell Integration Test"
            description = "This is a comprehensive test alert generated by PowerShell script to validate the webhook processing system and ensure proper data handling across different payload structures."
            severity = "Medium"
            priority = "Normal"
            status = "Resolved"
            category = "Infrastructure"
            url = "https://status.vrchat.com/powershell-integration-test"
            timestamp = $timestamp
            source = "PowerShell Test Framework"
            environment = "Testing"
            version = "1.0.0"
            metadata = @{
                test_id = $testId
                script_name = "Test-VRChatWebhook.ps1"
                execution_time = $timestamp
                powershell_version = $global:PSVersionTable.PSVersion.ToString()
                os_version = [System.Environment]::OSVersion.ToString()
                machine_name = [System.Environment]::MachineName
                user_domain = [System.Environment]::UserDomainName
                user_name = [System.Environment]::UserName
            }
            tags = @("test", "validation", "powershell", "webhook", "integration")
            metrics = @{
                response_time_ms = 0
                payload_size_bytes = 0
                test_iteration = 1
            }
            additional_data = @{
                test_scenarios = @("basic_connectivity", "data_validation", "error_handling")
                expected_outcomes = @("successful_processing", "proper_logging", "correct_response")
                validation_rules = @("schema_compliance", "data_integrity", "response_format")
            }
        }
    }
    
    # Webhookにリクエストを送信
    [TestResult] SendWebhook([hashtable]$payload, [string]$testName) {
        $result = [TestResult]::new($testName)
          try {
            Write-ColorLog "📤 Sending $testName test..." -Color Cyan
            
            # ペイロードサイズを計算
            $payloadJson = $payload | ConvertTo-Json -Depth 10 -Compress
            $payloadSize = [System.Text.Encoding]::UTF8.GetByteCount($payloadJson)
            
            Write-Verbose "Payload size: $payloadSize bytes"
            Write-Verbose "Payload preview: $($payloadJson.Substring(0, [Math]::Min(200, $payloadJson.Length)))..."
            
            # タイマー開始
            $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            
            # HTTP リクエスト送信
            $response = Invoke-RestMethod -Uri $this.WebhookUrl -Method Post -Body $payloadJson -ContentType "application/json" -TimeoutSec 30
            
            # タイマー停止
            $stopwatch.Stop()
            $elapsedMs = $stopwatch.ElapsedMilliseconds
            
            # 結果を記録
            $result.Success = $true
            $result.StatusCode = 200  # Invoke-RestMethod は成功時のみ到達
            $result.Response = ($response | ConvertTo-Json -Depth 3 -Compress)
            
            Write-ColorLog "   ✅ Success ($elapsedMs ms)" -Color Green
            Write-ColorLog "   📝 Response: $($result.Response)" -Color White
            
            # メトリクスを更新（汎用形式の場合）
            if ($testName -eq "Generic Format" -and $payload.ContainsKey("metrics")) {
                $payload.metrics.response_time_ms = $elapsedMs
                $payload.metrics.payload_size_bytes = $payloadSize
            }
            
        }
        catch {
            $result.Success = $false
            $result.ErrorMessage = $_.Exception.Message
            
            if ($_.Exception -is [System.Net.WebException]) {
                $webException = [System.Net.WebException]$_.Exception
                if ($webException.Response) {
                    $result.StatusCode = [int]$webException.Response.StatusCode
                    
                    try {
                        $reader = New-Object System.IO.StreamReader($webException.Response.GetResponseStream())
                        $result.Response = $reader.ReadToEnd()
                        $reader.Close()
                    }
                    catch {
                        $result.Response = "Unable to read response"
                    }
                }
            }
            
            Write-ColorLog "   ❌ Failed: $($result.ErrorMessage)" -Color Red
            if ($result.StatusCode -gt 0) {
                Write-ColorLog "   📊 Status Code: $($result.StatusCode)" -Color Yellow
            }
            if ($result.Response) {
                Write-ColorLog "   📝 Response: $($result.Response)" -Color White
            }
        }
        
        return $result
    }
    
    # 指定されたテストタイプを実行
    [TestResult] RunSingleTest([string]$testType) {
        $payload = $null
        $testName = ""
        
        switch ($testType.ToLower()) {
            "discord" {
                $payload = $this.GetDiscordPayload()
                $testName = "Discord Embed"
            }
            "statuspage" {
                $payload = $this.GetStatusPagePayload()
                $testName = "Status Page"
            }
            "generic" {
                $payload = $this.GetGenericPayload()
                $testName = "Generic Format"
            }
            default {
                throw "Invalid test type: $testType"
            }
        }
        
        $result = $this.SendWebhook($payload, $testName)
        $this.Results.Add($result)
        return $result
    }
    
    # すべてのテストを実行
    [void] RunAllTests() {
        $tests = @("discord", "statuspage", "generic")
        
        Write-ColorLog "🚀 Starting VRChat Webhook Tests..." -Color Magenta
        Write-ColorLog "🔗 Target URL: $($this.WebhookUrl)" -Color Yellow
        Write-ColorLog "⏱️  Delay between tests: $($this.DelaySeconds) seconds" -Color Gray
        Write-Host ""
        
        for ($i = 0; $i -lt $tests.Count; $i++) {
            $testType = $tests[$i]
            
            Write-ColorLog "📋 Test $($i + 1)/$($tests.Count): $testType" -Color Blue
            
            try {
                $this.RunSingleTest($testType)
            }
            catch {
                Write-ColorLog "   💥 Test setup failed: $($_.Exception.Message)" -Color Red
                
                $failedResult = [TestResult]::new($testType)
                $failedResult.ErrorMessage = $_.Exception.Message
                $this.Results.Add($failedResult)
            }
            
            # 最後のテスト以外は待機
            if ($i -lt ($tests.Count - 1)) {
                Write-ColorLog "   ⏳ Waiting $($this.DelaySeconds) seconds..." -Color Gray
                Start-Sleep -Seconds $this.DelaySeconds
            }
            
            Write-Host ""
        }
    }
    
    # テスト結果のサマリーを表示
    [void] ShowSummary() {
        Write-ColorLog "📊 Test Results Summary" -Color Magenta
        Write-ColorLog ("=" * 50) -Color Gray
        
        $successful = 0
        $failed = 0
        
        foreach ($result in $this.Results) {
            $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
            $statusColor = if ($result.Success) { [ConsoleColor]::Green } else { [ConsoleColor]::Red }
            
            Write-ColorLog "$($result.TestName.PadRight(20)): " -Color White -NoNewline
            Write-ColorLog $status -Color $statusColor
            
            if ($result.Success) {
                $successful++
            } else {
                $failed++
                if ($result.ErrorMessage) {
                    Write-ColorLog "  └─ Error: $($result.ErrorMessage)" -Color Red
                }
            }
        }
        
        Write-Host ""
        Write-ColorLog "📈 Total Results:" -Color Cyan
        Write-ColorLog "   ✅ Successful: $successful" -Color Green
        Write-ColorLog "   ❌ Failed: $failed" -Color Red
        Write-ColorLog "   📊 Success Rate: $([Math]::Round(($successful / $this.Results.Count) * 100, 1))%" -Color Yellow
        
        if ($failed -eq 0) {
            Write-ColorLog "🎉 All tests passed successfully!" -Color Green
        } else {
            Write-ColorLog "⚠️  Some tests failed. Please check the errors above." -Color Yellow
        }
    }
    
    # 詳細レポートをファイルに出力
    [void] SaveDetailedReport([string]$outputPath) {
        $reportData = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            webhook_url = $this.WebhookUrl
            total_tests = $this.Results.Count
            successful_tests = ($this.Results | Where-Object { $_.Success }).Count
            failed_tests = ($this.Results | Where-Object { -not $_.Success }).Count
            results = $this.Results | ForEach-Object {
                @{
                    test_name = $_.TestName
                    success = $_.Success
                    status_code = $_.StatusCode
                    response = $_.Response
                    error_message = $_.ErrorMessage
                    timestamp = $_.Timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                }
            }
        }
        
        $reportJson = $reportData | ConvertTo-Json -Depth 10
        Set-Content -Path $outputPath -Value $reportJson -Encoding UTF8
        
        Write-ColorLog "📄 Detailed report saved to: $outputPath" -Color Cyan
    }
}

# URL 検証関数
function Test-WebhookUrl {
    param([string]$Url)
    
    try {
        $uri = [System.Uri]::new($Url)
        if ($uri.Scheme -notin @("http", "https")) {
            return $false
        }
        if ($uri.Host -eq "") {
            return $false
        }
        return $true
    }
    catch {
        return $false
    }
}

# メイン実行部分
function Main {
    Write-ColorLog "🔧 VRChat Webhook Tester v1.0" -Color Magenta
    Write-ColorLog "=" * 50 -Color Gray
    
    # URL検証
    if (-not (Test-WebhookUrl -Url $WebhookUrl)) {
        Write-ColorLog "❌ Invalid webhook URL format: $WebhookUrl" -Color Red
        Write-ColorLog "   Expected format: https://script.google.com/macros/s/SCRIPT_ID/exec" -Color Yellow
        exit 1
    }
    
    # テスター初期化
    $tester = [VRChatWebhookTester]::new($WebhookUrl, $DelaySeconds)
    
    try {
        if ($TestType -eq "all") {
            $tester.RunAllTests()
        } else {
            Write-ColorLog "🚀 Running single test: $TestType" -Color Magenta
            Write-ColorLog "🔗 Target URL: $WebhookUrl" -Color Yellow
            Write-Host ""
            
            $tester.RunSingleTest($TestType)
        }
        
        # 結果表示
        $tester.ShowSummary()
        
        # 詳細レポート保存（オプション）
        if ($VerbosePreference -eq "Continue") {
            $reportPath = "VRChatWebhook_TestReport_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
            $tester.SaveDetailedReport($reportPath)
        }
        
        # 終了コード設定
        $failedCount = ($tester.Results | Where-Object { -not $_.Success }).Count
        if ($failedCount -gt 0) {
            exit 1
        } else {
            exit 0
        }
    }
    catch {
        Write-ColorLog "💥 Unexpected error occurred: $($_.Exception.Message)" -Color Red
        Write-ColorLog "📍 Stack trace:" -Color Yellow
        Write-ColorLog $_.ScriptStackTrace -Color Gray
        exit 2
    }
}

# スクリプト情報表示関数
function Show-Help {
    Write-Host @"
🔧 VRChat Webhook Tester v1.0

DESCRIPTION:
    Google Apps Script で作成した VRChat 障害通知 Webhook レシーバーの動作を検証します。

USAGE:
    .\Test-VRChatWebhook.ps1 -WebhookUrl <URL> [-TestType <TYPE>] [-DelaySeconds <SECONDS>] [-Verbose]

PARAMETERS:
    -WebhookUrl     : テスト対象の Webhook URL (必須)
    -TestType       : テストの種類 (discord, statuspage, generic, all) [デフォルト: all]
    -DelaySeconds   : テスト間の待機時間（秒） [デフォルト: 2]
    -Verbose        : 詳細ログの出力と結果レポートファイルの生成

EXAMPLES:
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" -TestType discord
    .\Test-VRChatWebhook.ps1 -WebhookUrl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" -Verbose

"@
}

# ヘルプ表示判定
if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "/?" -or $args -contains "/h") {
    Show-Help
    exit 0
}

# メイン実行
Main
