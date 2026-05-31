$ErrorActionPreference = "Stop"

$clientId = "178c6fc778ccc68e1d6a"
$scope = "repo"
$deviceResp = Invoke-WebRequest `
  -Uri "https://github.com/login/device/code" `
  -Method Post `
  -Body "client_id=$clientId&scope=$scope" `
  -ContentType "application/x-www-form-urlencoded" `
  -UseBasicParsing `
  -TimeoutSec 30

$deviceText = [System.Text.Encoding]::UTF8.GetString($deviceResp.RawContentStream.ToArray())
if (-not $deviceText) {
  $deviceText = $deviceResp.Content
}
$pairs = @{}
foreach ($part in $deviceText -split "&") {
  $kv = $part -split "=", 2
  if ($kv.Length -eq 2) {
    $pairs[[System.Web.HttpUtility]::UrlDecode($kv[0])] = [System.Web.HttpUtility]::UrlDecode($kv[1])
  }
}

$userCode = $pairs["user_code"]
$deviceCode = $pairs["device_code"]
$verificationUri = $pairs["verification_uri"]
$interval = [int]($pairs["interval"] ?? "5")

Write-Host ""
Write-Host "GitHub 一次性验证码：$userCode"
Write-Host "授权页面：$verificationUri"
Write-Host "请在打开的 GitHub 页面输入验证码并授权。授权完成前不要关闭这个窗口。"
Write-Host ""

Start-Process $verificationUri

$token = $null
$deadline = (Get-Date).AddMinutes(15)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $interval
  $body = "client_id=$clientId&device_code=$deviceCode&grant_type=urn:ietf:params:oauth:grant-type:device_code"
  $poll = Invoke-WebRequest `
    -Uri "https://github.com/login/oauth/access_token" `
    -Method Post `
    -Body $body `
    -ContentType "application/x-www-form-urlencoded" `
    -Headers @{ Accept = "application/json" } `
    -UseBasicParsing `
    -TimeoutSec 30
  $data = $poll.Content | ConvertFrom-Json
  if ($data.access_token) {
    $token = $data.access_token
    break
  }
  if ($data.error -eq "authorization_pending") {
    Write-Host "等待你在浏览器完成授权..."
    continue
  }
  if ($data.error -eq "slow_down") {
    $interval += 5
    continue
  }
  throw "GitHub 授权失败：$($data.error) $($data.error_description)"
}

if (-not $token) {
  throw "GitHub 授权超时。"
}

$tokenPath = Join-Path $PSScriptRoot ".github_token.tmp"
Set-Content -LiteralPath $tokenPath -Value $token -NoNewline
Write-Host "GitHub 授权完成。"
