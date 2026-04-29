# Test MCP Tools Directly from Source
# Tests individual tool handlers to identify hanging issues

$ErrorActionPreference = "Stop"

Write-Host "=== Direct Tool Handler Test ===" -ForegroundColor Cyan

# Import the tool handlers
$libPath = "lib\tools"
Write-Host "Loading tool handlers from $libPath..." -ForegroundColor Yellow

# Test each handler module
$handlers = @(
    "config-handlers.js",
    "registry-config.js",
    "governance-router-handler.js"
)

foreach ($handler in $handlers) {
    $handlerPath = Join-Path $libPath $handler
    if (Test-Path $handlerPath) {
        Write-Host "Testing $handler..." -ForegroundColor Yellow
        
        try {
            # Try to load the module
            $content = Get-Content $handlerPath -Raw
            Write-Host "  [OK] File loaded: $([math]::Round($content.Length / 1KB, 2)) KB" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR] Failed to load: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  [SKIP] File not found" -ForegroundColor Gray
    }
}

# Test specific handler functions that might hang
Write-Host "`n=== Testing Handler Functions ===" -ForegroundColor Cyan

# Test config handler with timeout
Write-Host "Testing config_manage handler (5s timeout)..." -ForegroundColor Yellow
try {
    $job = Start-Job -ScriptBlock {
        Set-Location "D:\SWEObeyMe-restored"
        node -e "
        import('./lib/tools/config-handlers.js').then(m => {
          console.log('[OK] config-handlers module loaded');
          const handlers = Object.keys(m).filter(k => typeof m[k] === 'function');
          console.log('[INFO] Available handlers:', handlers.length > 0 ? handlers : 'none (default export?)');
        }).catch(err => {
          console.error('[ERROR]', err.message);
          process.exit(1);
        });
        " 2>&1
    }
    $result = Wait-Job $job -Timeout 5
    if ($result) {
        Receive-Job $job
        Remove-Job $job
        Write-Host "  [OK] Handler test completed" -ForegroundColor Green
    } else {
        Remove-Job $job -Force
        Write-Host "  [HANG] Handler test timed out (5s)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] $_" -ForegroundColor Red
}

# Test MCP server startup with timeout
Write-Host "`n=== Testing MCP Server Startup (10s timeout) ===" -ForegroundColor Cyan
try {
    $job = Start-Job -ScriptBlock {
        Set-Location "D:\SWEObeyMe-restored"
        node test-mcp-local.js 2>&1
    }
    $result = Wait-Job $job -Timeout 10
    if ($result) {
        $output = Receive-Job $job
        Remove-Job $job
        Write-Host $output
        Write-Host "  [OK] Server test completed" -ForegroundColor Green
    } else {
        Remove-Job $job -Force
        Write-Host "  [HANG] Server test timed out (10s)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [ERROR] $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
