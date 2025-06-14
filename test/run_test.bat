@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM VRChat Webhook テスト実行用バッチファイル
REM Usage: run_test.bat [WEBHOOK_URL] [TEST_TYPE]

echo ========================================
echo VRChat Webhook Tester - Batch Launcher
echo ========================================
echo.

REM 引数チェック
if "%~1"=="" (
    echo Error: Webhook URL is required
    echo.
    echo Usage: %~nx0 ^<WEBHOOK_URL^> [TEST_TYPE]
    echo.
    echo Examples:
    echo   %~nx0 "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    echo   %~nx0 "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" discord
    echo   %~nx0 "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" all
    echo.
    echo Available test types: discord, statuspage, generic, all
    pause
    exit /b 1
)

set "WEBHOOK_URL=%~1"
set "TEST_TYPE=%~2"

REM デフォルトのテストタイプ
if "%TEST_TYPE%"=="" set "TEST_TYPE=all"

echo Webhook URL: %WEBHOOK_URL%
echo Test Type: %TEST_TYPE%
echo.

REM PowerShell実行可能性チェック
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo Error: PowerShell is not available or accessible
    echo Please ensure PowerShell is installed and accessible from command line
    pause
    exit /b 1
)

REM PowerShellスクリプト存在チェック
if not exist "%~dp0Test-VRChatWebhook.ps1" (
    echo Error: Test-VRChatWebhook.ps1 not found in the same directory
    echo Expected location: %~dp0Test-VRChatWebhook.ps1
    pause
    exit /b 1
)

echo Starting PowerShell test script...
echo.

REM PowerShellスクリプト実行（UTF-8エンコーディング対応）
powershell -ExecutionPolicy Bypass -Command "$OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & '%~dp0Test-VRChatWebhook.ps1' -WebhookUrl '%WEBHOOK_URL%' -TestType '%TEST_TYPE%' -Verbose"

REM 結果コードの確認
if errorlevel 2 (
    echo.
    echo [CRITICAL] Unexpected error occurred during test execution
    set "EXIT_CODE=2"
) else if errorlevel 1 (
    echo.
    echo [WARNING] Some tests failed
    set "EXIT_CODE=1"
) else (
    echo.
    echo [SUCCESS] All tests completed successfully
    set "EXIT_CODE=0"
)

echo.
echo Test execution completed with exit code: !EXIT_CODE!
echo.

REM インタラクティブモードの場合は一時停止
if /i "%~3"=="interactive" (
    pause
)

exit /b !EXIT_CODE!
