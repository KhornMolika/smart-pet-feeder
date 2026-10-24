# ==============================================================================
# ChinChem Smart Pet Feeder - End-to-End Pipeline Diagnostic & Validation Tool
# ==============================================================================
# Tests the full loop:
# TMA Request -> NestJS Security BFF -> DB Transaction -> MQTT Broker -> ESP32 Topics
# ==============================================================================

param(
    [string]$BaseUrl = "https://chinchem.molika.app",
    [string]$DeviceId = "feeder_esp32_01",
    [int]$DurationMs = 15000,
    [string]$MqttHost = "chinchem.molika.app",
    [int]$MqttPort = 1883
)

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " [ChinChem Feeder] End-to-End Pipeline Diagnostic Runner" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Target Backend API: $BaseUrl" -ForegroundColor White
Write-Host " Target Hardware ID: $DeviceId" -ForegroundColor White
Write-Host " Test Dispense Time: ${DurationMs} ms" -ForegroundColor White
Write-Host " MQTT Broker:        ${MqttHost}:${MqttPort}" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-bff-source" = "NextJS-AppRouter"
}

# ------------------------------------------------------------------------------
# Test 1: TCP Port Probe to MQTT Broker
# ------------------------------------------------------------------------------
Write-Host "[1/5] Testing TCP Connection to Mosquitto Broker (${MqttHost}:${MqttPort})..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $tcp.BeginConnect($MqttHost, $MqttPort, $null, $null)
    $success = $asyncResult.AsyncWaitHandle.WaitOne(3000, $false)
    if ($success -and $tcp.Connected) {
        Write-Host "  PASS: MQTT Broker is ONLINE and accepting TCP socket connections!" -ForegroundColor Green
        $tcp.Close()
    } else {
        Write-Host "  FAIL: Could not establish TCP connection to ${MqttHost}:${MqttPort} (Timeout 3s)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ------------------------------------------------------------------------------
# Test 2: Trigger Manual Feed via Backend API
# ------------------------------------------------------------------------------
Write-Host "[2/5] Testing Manual Feed Command Dispatch (POST /api/v1/devices/$DeviceId/feed)..." -ForegroundColor Yellow
$feedPayload = @{
    durationMs = $DurationMs
} | ConvertTo-Json

try {
    $feedUrl = "$BaseUrl/api/v1/devices/$DeviceId/feed"
    $response = Invoke-RestMethod -Uri $feedUrl -Method Post -Headers $headers -Body $feedPayload -TimeoutSec 10
    
    Write-Host "  PASS: HTTP 200 OK received from Backend BFF!" -ForegroundColor Green
    Write-Host "     - Command ID:  $($response.id)" -ForegroundColor Cyan
    Write-Host "     - Device ID:   $($response.deviceId)" -ForegroundColor Cyan
    Write-Host "     - Duration:    $($response.durationMs) ms" -ForegroundColor Cyan
    Write-Host "     - Status:      $($response.status)" -ForegroundColor Cyan
    Write-Host "     - Issued At:   $($response.issuedAt)" -ForegroundColor Cyan
    Write-Host "     - Expires At:  $($response.expiresAt)" -ForegroundColor Cyan
    Write-Host "  Dispatched to MQTT topic: feeders/$DeviceId/cmd/feed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Feed trigger failed!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respBody = $reader.ReadToEnd()
        Write-Host "     HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "     Response:    $respBody" -ForegroundColor Red
    } else {
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ------------------------------------------------------------------------------
# Test 3: Emergency Stop Command Dispatch
# ------------------------------------------------------------------------------
Write-Host "[3/5] Testing Stop Feed Command Dispatch (POST /api/v1/devices/$DeviceId/stop)..." -ForegroundColor Yellow
try {
    $stopUrl = "$BaseUrl/api/v1/devices/$DeviceId/stop"
    $response = Invoke-RestMethod -Uri $stopUrl -Method Post -Headers $headers -Body "{}" -TimeoutSec 10

    Write-Host "  PASS: HTTP 200 OK received for Stop Command!" -ForegroundColor Green
    Write-Host "     - Message:    $($response.message)" -ForegroundColor Cyan
    Write-Host "     - Stopped:    $($response.stopped)" -ForegroundColor Cyan
    Write-Host "     - Timestamp:  $($response.timestamp)" -ForegroundColor Cyan
    Write-Host "  Dispatched to MQTT topics: feeders/$DeviceId/cmd/stop and feeders/$DeviceId/cmd/feed" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Stop command failed!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "     Response: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}

Write-Host ""
Start-Sleep -Seconds 1

# ------------------------------------------------------------------------------
# Test 4: Create & Sync Feeding Schedule
# ------------------------------------------------------------------------------
Write-Host "[4/5] Testing Schedule Creation & MQTT Sync (POST /api/v1/devices/$DeviceId/schedules)..." -ForegroundColor Yellow
$now = Get-Date
$testMinute = ($now.Minute + 3) % 60
$testHour = $now.Hour
$timeString = "{0:D2}:{1:D2}" -f $testHour, $testMinute

$schedPayload = @{
    label = "E2E Pipeline Test Alarm"
    timeLocal = $timeString
    daysOfWeek = @(0, 1, 2, 3, 4, 5, 6)
    durationMs = $DurationMs
    enabled = $true
} | ConvertTo-Json

try {
    $schedUrl = "$BaseUrl/api/v1/devices/$DeviceId/schedules"
    $response = Invoke-RestMethod -Uri $schedUrl -Method Post -Headers $headers -Body $schedPayload -TimeoutSec 10

    Write-Host "  PASS: Schedule created and synced to MQTT config/desired!" -ForegroundColor Green
    Write-Host "     - Schedule ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "     - Label:       $($response.label)" -ForegroundColor Cyan
    Write-Host "     - Time:        $($response.timeLocal)" -ForegroundColor Cyan
    Write-Host "     - Duration:    $($response.durationMs) ms" -ForegroundColor Cyan
    Write-Host "     - Days:        $($response.daysOfWeek -join ', ')" -ForegroundColor Cyan
    Write-Host "  Desired config retained on: feeders/$DeviceId/config/desired" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Schedule creation failed!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "     Response: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}

Write-Host ""

# ------------------------------------------------------------------------------
# Test 5: Verify Feeding History Event Ingestion
# ------------------------------------------------------------------------------
Write-Host "[5/5] Querying Authoritative Feeding History (GET /api/v1/devices/$DeviceId/events)..." -ForegroundColor Yellow
try {
    $historyUrl = "$BaseUrl/api/v1/devices/$DeviceId/events?limit=5"
    $events = Invoke-RestMethod -Uri $historyUrl -Method Get -Headers $headers -TimeoutSec 10

    if ($events -and $events.Count -gt 0) {
        Write-Host "  PASS: Retrieved $($events.Count) recent hardware/app event(s) from PostgreSQL:" -ForegroundColor Green
        foreach ($ev in $events | Select-Object -First 3) {
            Write-Host "     - [$($ev.startedAt)] Source: $($ev.source) | Duration: $($ev.durationMs)ms | Status: $($ev.status) | Note: $($ev.note)" -ForegroundColor White
        }
    } else {
        Write-Host "  No feeding history events found in database yet." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL: Could not retrieve events: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Summary & Verification Guidelines" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " 1. Open your ESP32 Serial Monitor (115200 baud)." -ForegroundColor White
Write-Host "    You should immediately observe:" -ForegroundColor White
Write-Host "      [MQTT IN] Topic: feeders/$DeviceId/cmd/feed" -ForegroundColor Green
Write-Host "      [MQTT IN] Payload: {...'durationMs': $DurationMs...}" -ForegroundColor Green
Write-Host "      [Servo] Opening dispenser gate to 90 degrees..." -ForegroundColor Green
Write-Host " 2. The LCD display counts down: DISPENSING FOOD! Remaining: 15s" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
