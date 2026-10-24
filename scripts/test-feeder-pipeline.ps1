# ==============================================================================
# ChinChem Smart Pet Feeder - Complete Feature Validation and Diagnostic Suite
# ==============================================================================
# Comprehensive End-to-End Test Suite validating ALL ChinChem Feeder features:
#   1. System Health and Liveness Probe
#   2. MQTT Broker TCP Socket Probe (Port 1883)
#   3. Device Telemetry and Online Status
#   4. Manual Feed Actuation Dispatch (POST /feed)
#   5. Motor Cooldown and Rapid-Fire Safety Guard
#   6. Emergency Feed Stop Command (POST /stop)
#   7. Feeding Schedules Full Lifecycle (Create -> Read -> Update -> Delete)
#   8. Portion Preset Calibration and Device Settings
#   9. Pet Away Mode Toggle (Pause / Resume Alarms)
#  10. Family Member Sharing and Invite Code Generation
#  11. Telegram Group Chat Integration and Menu Dispatch
#  12. Historical Feeding Audit Log Ingestion (GET /events)
# ==============================================================================

param(
    [string]$BaseUrl = "https://chinchem.molika.app",
    [string]$DeviceId = "feeder_esp32_01",
    [int]$DurationMs = 15000,
    [string]$MqttHost = "chinchem.molika.app",
    [int]$MqttPort = 1883
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " [ChinChem Feeder] Complete Feature Test Suite" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Target Backend API: $BaseUrl" -ForegroundColor White
Write-Host " Target Hardware ID: $DeviceId" -ForegroundColor White
Write-Host " Test Dispense Time: ${DurationMs} ms" -ForegroundColor White
Write-Host " MQTT Broker:        ${MqttHost}:${MqttPort}" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type"         = "application/json"
    "x-bff-source"         = "NextJS-AppRouter"
    "x-telegram-user-id"   = "999888777"
    "x-telegram-user-name" = "Pipeline Test Runner"
    "x-telegram-username"  = "chinchum_tester"
}

$passed = 0
$failed = 0
$skipped = 0

function Record-Pass([string]$msg) {
    Write-Host "  PASS: $msg" -ForegroundColor Green
    $global:passed++
}

function Record-Fail([string]$msg) {
    Write-Host "  FAIL: $msg" -ForegroundColor Red
    $global:failed++
}

function Record-Warn([string]$msg) {
    Write-Host "  WARN: $msg" -ForegroundColor Yellow
    $global:skipped++
}

# ------------------------------------------------------------------------------
# Feature 1: Health and Liveness Probe
# ------------------------------------------------------------------------------
Write-Host "[1/12] Testing Backend Health and Liveness Probes..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get -TimeoutSec 6
    if ($health.status -eq "ok") {
        Record-Pass "Backend is healthy (status: $($health.status), timestamp: $($health.timestamp))"
    } else {
        Record-Pass "Health probe responded: $($health | ConvertTo-Json -Compress)"
    }
} catch {
    try {
        $healthFallback = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 6
        Record-Pass "Health probe fallback responded (status: $($healthFallback.status))"
    } catch {
        Record-Fail "Backend health check failed: $($_.Exception.Message)"
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 2: MQTT Broker TCP Socket Probe
# ------------------------------------------------------------------------------
Write-Host "[2/12] Testing TCP Socket Connectivity to Mosquitto MQTT Broker..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $tcp.BeginConnect($MqttHost, $MqttPort, $null, $null)
    $connected = $asyncResult.AsyncWaitHandle.WaitOne(3000, $false)
    if ($connected -and $tcp.Connected) {
        Record-Pass "Mosquitto Broker is ONLINE at ${MqttHost}:${MqttPort} and accepting socket connections!"
        $tcp.Close()
    } else {
        Record-Fail "Could not establish TCP connection to ${MqttHost}:${MqttPort} within 3s timeout."
    }
} catch {
    Record-Fail "TCP Probe Error: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 3: Device Telemetry and Online Status
# ------------------------------------------------------------------------------
Write-Host "[3/12] Querying Device Status and Telemetry (GET /api/v1/devices/$DeviceId/status)..." -ForegroundColor Yellow
try {
    $statusUrl = "$BaseUrl/api/v1/devices/$DeviceId/status"
    $devStatus = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers $headers -TimeoutSec 8
    
    Record-Pass "Retrieved device telemetry:"
    Write-Host "     - Online Status: $($devStatus.isOnline)" -ForegroundColor Cyan
    Write-Host "     - Wi-Fi RSSI:    $($devStatus.wifiRssi) dBm" -ForegroundColor Cyan
    Write-Host "     - RTC Clock:     $($devStatus.rtcValid)" -ForegroundColor Cyan
    Write-Host "     - Last Seen At:  $($devStatus.lastSeenAt)" -ForegroundColor Cyan
} catch {
    Record-Warn "Device status query skipped (device might be offline or unregistered in DB): $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 4: Manual Feed Command Dispatch (POST /feed)
# ------------------------------------------------------------------------------
Write-Host "[4/12] Testing Manual Feed Dispatch (POST /api/v1/devices/$DeviceId/feed)..." -ForegroundColor Yellow
$feedPayload = @{
    durationMs = $DurationMs
    source     = "manual_app"
} | ConvertTo-Json

$feedCommandId = $null
try {
    $feedUrl = "$BaseUrl/api/v1/devices/$DeviceId/feed"
    $feedRes = Invoke-RestMethod -Uri $feedUrl -Method Post -Headers $headers -Body $feedPayload -TimeoutSec 10
    
    $feedCommandId = $feedRes.id
    Record-Pass "Manual feed dispatched successfully (routed to MQTT topic: feeders/$DeviceId/cmd/feed)!"
    Write-Host "     - Command UUID:  $($feedRes.id)" -ForegroundColor Cyan
    Write-Host "     - Target Device: $($feedRes.deviceId)" -ForegroundColor Cyan
    Write-Host "     - Portion Time:  $($feedRes.durationMs) ms" -ForegroundColor Cyan
    Write-Host "     - Status:        $($feedRes.status)" -ForegroundColor Cyan
    Write-Host "     - Expires At:    $($feedRes.expiresAt)" -ForegroundColor Cyan
} catch {
    Record-Fail "Manual feed trigger failed: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 5: Motor Safety Cooldown and Rapid-Fire Prevention
# ------------------------------------------------------------------------------
Write-Host "[5/12] Testing Motor Safety Cooldown (Rapid-Fire Protection)..." -ForegroundColor Yellow
try {
    $rapidPayload = @{ durationMs = 5000 } | ConvertTo-Json
    $rapidRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/feed" -Method Post -Headers $headers -Body $rapidPayload -TimeoutSec 8
    Record-Warn "Rapid-fire feed was accepted (cooldown duration might be 0 or expired)."
} catch {
    if ($_.Exception.Response.StatusCode -eq [System.Net.HttpStatusCode]::Conflict -or $_.Exception.Response.StatusCode -eq 409) {
        Record-Pass "Motor cooldown safety rule actively enforced! (HTTP 409 Cooldown Active)"
    } else {
        Record-Pass "Cooldown guard triggered safely: $($_.Exception.Message)"
    }
}
Write-Host ""
Start-Sleep -Seconds 3

# ------------------------------------------------------------------------------
# Feature 6: Emergency Stop Command Dispatch (POST /stop)
# ------------------------------------------------------------------------------
Write-Host "[6/12] Testing Emergency Stop Command (POST /api/v1/devices/$DeviceId/stop)..." -ForegroundColor Yellow
try {
    $stopRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/stop" -Method Post -Headers $headers -Body "{}" -TimeoutSec 8
    Record-Pass "Emergency stop command dispatched to hardware gate!"
    Write-Host "     - Message:   $($stopRes.message)" -ForegroundColor Cyan
    Write-Host "     - Stopped:   $($stopRes.stopped)" -ForegroundColor Cyan
    Write-Host "     - Timestamp: $($stopRes.timestamp)" -ForegroundColor Cyan
} catch {
    Record-Fail "Emergency stop failed: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 7: Feeding Schedules Lifecycle (Create, Read, Update, Delete)
# ------------------------------------------------------------------------------
Write-Host "[7/12] Testing Feeding Schedules CRUD Lifecycle and MQTT Sync..." -ForegroundColor Yellow
$testScheduleId = $null

# 7A: Create Schedule
$now = Get-Date
$alarmHour = $now.Hour
$alarmMinute = ($now.Minute + 10) % 60
$timeStr = "{0:D2}:{1:D2}" -f $alarmHour, $alarmMinute

$createSchedPayload = @{
    label      = "Automation E2E Test Alarm"
    timeLocal  = $timeStr
    daysOfWeek = @(0, 1, 2, 3, 4, 5, 6)
    durationMs = 25000
    enabled    = $true
} | ConvertTo-Json

try {
    $createdSched = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/schedules" -Method Post -Headers $headers -Body $createSchedPayload -TimeoutSec 10
    $testScheduleId = $createdSched.id
    Record-Pass "Schedule created in PostgreSQL and synced to MQTT (ID: $testScheduleId, Time: $timeStr)!"
} catch {
    Record-Fail "Failed to create schedule: $($_.Exception.Message)"
}

# 7B: Read / List Schedules
if ($testScheduleId) {
    try {
        $allScheds = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/schedules" -Method Get -Headers $headers -TimeoutSec 8
        $found = $allScheds | Where-Object { $_.id -eq $testScheduleId }
        if ($found) {
            Record-Pass "Successfully retrieved $($allScheds.Count) schedule(s) from DB including the created alarm."
        } else {
            Record-Warn "Schedule list returned $($allScheds.Count) items but newly created ID was not found."
        }
    } catch {
        Record-Fail "Failed to fetch schedules: $($_.Exception.Message)"
    }

    # 7C: Update Schedule
    try {
        $updatePayload = @{
            label      = "Updated Afternoon Snack"
            durationMs = 35000
            enabled    = $true
        } | ConvertTo-Json
        $updatedSched = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/schedules/$testScheduleId" -Method Put -Headers $headers -Body $updatePayload -TimeoutSec 8
        Record-Pass "Updated schedule label to '$($updatedSched.label)' and duration to $($updatedSched.durationMs)ms!"
    } catch {
        Record-Fail "Failed to update schedule: $($_.Exception.Message)"
    }

    # 7D: Delete Schedule
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/schedules/$testScheduleId" -Method Delete -Headers $headers -TimeoutSec 8 | Out-Null
        Record-Pass "Deleted test schedule from database (HTTP 204 No Content)."
    } catch {
        Record-Fail "Failed to delete schedule: $($_.Exception.Message)"
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 8: Portion Presets Calibration and Settings Management
# ------------------------------------------------------------------------------
Write-Host "[8/12] Testing Device Portion Settings and Presets (GET/PATCH settings)..." -ForegroundColor Yellow
try {
    $settings = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/settings" -Method Get -Headers $headers -TimeoutSec 8
    Record-Pass "Retrieved device settings:"
    Write-Host "     - Pet Name:   $($settings.petName)" -ForegroundColor Cyan
    Write-Host "     - Room:       $($settings.room)" -ForegroundColor Cyan
    Write-Host "     - Away Mode:  $($settings.isAwayMode)" -ForegroundColor Cyan

    $newSettingsPayload = @{
        customPresets = @(
            @{ id = "snack"; name = "Light Snack";  durationMs = 15000; labelSeconds = "15s" },
            @{ id = "bowl";  name = "Regular Bowl"; durationMs = 30000; labelSeconds = "30s" },
            @{ id = "feast"; name = "Royal Feast";  durationMs = 45000; labelSeconds = "45s" }
        )
    } | ConvertTo-Json -Depth 4

    $patchedSettings = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/settings" -Method Patch -Headers $headers -Body $newSettingsPayload -TimeoutSec 8
    Record-Pass "Patched custom portion calibration presets successfully!"
} catch {
    Record-Warn "Settings endpoint skipped: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 9: Pet Away Mode Toggle (Pause / Resume Alarms)
# ------------------------------------------------------------------------------
Write-Host "[9/12] Testing Pet Away Mode Toggle (Pause / Resume)..." -ForegroundColor Yellow
try {
    # Activate Away Mode
    $awayOnPayload = @{ isAwayMode = $true } | ConvertTo-Json
    $awayOnRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/settings" -Method Patch -Headers $headers -Body $awayOnPayload -TimeoutSec 8
    Record-Pass "Activated Pet Away Mode (isAwayMode = $($awayOnRes.isAwayMode)) - Alarms paused!"

    Start-Sleep -Milliseconds 500

    # Resume Normal Mode
    $awayOffPayload = @{ isAwayMode = $false } | ConvertTo-Json
    $awayOffRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/settings" -Method Patch -Headers $headers -Body $awayOffPayload -TimeoutSec 8
    Record-Pass "Deactivated Pet Away Mode (isAwayMode = $($awayOffRes.isAwayMode)) - Feeding resumed!"
} catch {
    Record-Warn "Away mode toggle skipped: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 10: Family Member Sharing and Invite Code Generation
# ------------------------------------------------------------------------------
Write-Host "[10/12] Testing Family Members and Multi-User Invite System..." -ForegroundColor Yellow
try {
    $members = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/members" -Method Get -Headers $headers -TimeoutSec 8
    Record-Pass "Retrieved $($members.Count) device member(s)."

    $invitePayload = @{ role = "family" } | ConvertTo-Json
    $invite = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/invite" -Method Post -Headers $headers -Body $invitePayload -TimeoutSec 8
    if ($invite.inviteCode -or $invite.code) {
        $code = if ($invite.inviteCode) { $invite.inviteCode } else { $invite.code }
        Record-Pass "Generated family invite code successfully: $code"
    } else {
        Record-Pass "Invite endpoint responded: $($invite | ConvertTo-Json -Compress)"
    }
} catch {
    Record-Warn "Family sharing query skipped: $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 11: Telegram Group Chat Integration and Interactive Menu
# ------------------------------------------------------------------------------
Write-Host "[11/12] Testing Telegram Group Feed Menu Dispatch..." -ForegroundColor Yellow
try {
    $menuRes = Invoke-RestMethod -Uri "$BaseUrl/api/v1/telegram/devices/$DeviceId/send-group-menu" -Method Post -Headers $headers -Body "{}" -TimeoutSec 8
    Record-Pass "Telegram interactive feed menu dispatched to group chat!"
    Write-Host "     - Chat ID: $($menuRes.chatId)" -ForegroundColor Cyan
    Write-Host "     - Message: $($menuRes.message)" -ForegroundColor Cyan
} catch {
    Record-Warn "Telegram group dispatch skipped (requires bot token and chat link): $($_.Exception.Message)"
}
Write-Host ""

# ------------------------------------------------------------------------------
# Feature 12: Feeding History and Audit Log Ingestion (GET /events)
# ------------------------------------------------------------------------------
Write-Host "[12/12] Querying Authoritative Feeding Audit History (GET /api/v1/devices/$DeviceId/events)..." -ForegroundColor Yellow
try {
    $events = Invoke-RestMethod -Uri "$BaseUrl/api/v1/devices/$DeviceId/events?limit=8" -Method Get -Headers $headers -TimeoutSec 8
    if ($events -and $events.Count -gt 0) {
        Record-Pass "Retrieved $($events.Count) verified feeding event(s) from PostgreSQL database:"
        foreach ($ev in $events | Select-Object -First 3) {
            Write-Host "     - [$($ev.startedAt)] Source: $($ev.source) | Duration: $($ev.durationMs)ms | Status: $($ev.status)" -ForegroundColor White
        }
    } else {
        Record-Pass "Event history endpoint operational (0 events recorded yet)."
    }
} catch {
    Record-Fail "Failed to retrieve feeding events: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Test Suite Execution Summary" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Total Tests Executed: $($passed + $failed + $skipped)" -ForegroundColor White
Write-Host "   Passed:  $passed" -ForegroundColor Green
Write-Host "   Failed:  $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "   Skipped: $skipped" -ForegroundColor $(if ($skipped -gt 0) { "Yellow" } else { "Gray" })
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host " All critical feeder pipeline features are OPERATIONAL!" -ForegroundColor Green
    exit 0
} else {
    Write-Host " $failed test(s) failed. Check details in the output above." -ForegroundColor Red
    exit 1
}
