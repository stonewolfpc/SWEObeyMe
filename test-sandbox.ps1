<#
.SYNOPSIS
    Tests SWEObeyMe MCP server in Windows Sandbox.
.DESCRIPTION
    Packages the extension, copies to Windows Sandbox, installs dependencies,
    and tests MCP server startup.
.NOTES
    Requires Windows Sandbox enabled.
#>

$ErrorActionPreference = "Stop"

# --- CONFIGURATION ---
$ProjectRoot = "D:\SWEObeyMe-restored"
$SandboxShare = "C:\Temp\SandboxShare"
$SandboxInternalShare = "C:\SandboxShare"

Write-Host "=== SWEObeyMe Sandbox Test ===" -ForegroundColor Cyan

# 1. Skip Windows Sandbox check (user already enabled it)
Write-Host "[OK] Windows Sandbox (assumed enabled)" -ForegroundColor Green

# 2. Build and package extension
Write-Host "`nBuilding extension..." -ForegroundColor Yellow
Push-Location $ProjectRoot
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    Pop-Location
    exit 1
}

Write-Host "Packaging extension..." -ForegroundColor Yellow
& npx vsce package
if ($LASTEXITCODE -ne 0) {
    Write-Error "Package failed"
    Pop-Location
    exit 1
}

$vsixFile = Get-ChildItem -Path $ProjectRoot -Filter "*.vsix" | Select-Object -First 1
if (-not $vsixFile) {
    Write-Error "No VSIX file found"
    Pop-Location
    exit 1
}
Write-Host "[OK] Extension packaged: $($vsixFile.Name)" -ForegroundColor Green
Pop-Location

# 3. Create sandbox share folder
if (-not (Test-Path $SandboxShare)) {
    New-Item -ItemType Directory -Path $SandboxShare -Force | Out-Null
}

# 4. Copy files to sandbox share
Write-Host "`nCopying files to sandbox share..." -ForegroundColor Yellow
Remove-Item -Path "$SandboxShare\*" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path $vsixFile.FullName -Destination $SandboxShare -Force

# Copy Node.js if available
if (Test-Path "C:\nvm4w\nodejs") {
    Copy-Item -Path "C:\nvm4w\nodejs" -Destination "$SandboxShare\nodejs" -Recurse -Force
    Write-Host "[OK] Node.js copied" -ForegroundColor Green
}

# 5. Create setup script for sandbox (separate file)
$setupScriptContent = @"
`$LogFile = "C:\SandboxShare\sandbox-test-log.txt"
Start-Transcript -Path `$LogFile -Force

Write-Host "=== SWEObeyMe Sandbox Setup ===" -ForegroundColor Cyan

# Set up Node.js
`$NodeDir = "C:\SandboxShare\nodejs"
if (Test-Path `$NodeDir) {
    `$env:PATH = "`$NodeDir;`$env:PATH"
    Write-Host "[OK] Node.js configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Node.js not found in share" -ForegroundColor Yellow
}

# Extract VSIX
`$VsixPath = Get-ChildItem -Path "C:\SandboxShare\*.vsix" | Select-Object -First 1
`$ExtractDir = "`$env:TEMP\SWEObeyMe-Test"
if (Test-Path `$ExtractDir) { Remove-Item -Path `$ExtractDir -Recurse -Force }
New-Item -ItemType Directory -Path `$ExtractDir -Force | Out-Null

Write-Host "Extracting VSIX..." -ForegroundColor Yellow
try {
    Expand-Archive -Path `$VsixPath.FullName -DestinationPath `$ExtractDir -Force
    Write-Host "[OK] VSIX extracted" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to extract VSIX: `$_" -ForegroundColor Red
    Stop-Transcript
    exit 1
}

# Install dependencies
`$ExtensionDir = "`$ExtractDir\extension"
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
Push-Location `$ExtensionDir
npm install --production 2>&1 | Tee-Object -FilePath `$LogFile -Append
if (`$LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed" -ForegroundColor Red
    Pop-Location
    Stop-Transcript
    exit 1
}
Pop-Location
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# Test MCP server
`$ServerPath = "`$ExtensionDir\dist\mcp\server.js"
if (-not (Test-Path `$ServerPath)) {
    Write-Host "[ERROR] Server file not found: `$ServerPath" -ForegroundColor Red
    Stop-Transcript
    exit 1
}

Write-Host "`n=== Testing MCP Server ===" -ForegroundColor Cyan
Write-Host "Starting server..." -ForegroundColor Yellow

`$env:NODE_ENV = "production"
`$env:SWEOBEYME_BACKUP_DIR = "`$env:LOCALAPPDATA\.sweobeyme-backups"
`$env:SWEOBEYME_DEBUG = "1"

`$ServerProcess = Start-Process -FilePath "C:\SandboxShare\nodejs\node.exe" -ArgumentList "--no-warnings", `$ServerPath -RedirectStandardOutput "$LogFile" -RedirectStandardError "$LogFile" -PassThru

Write-Host "Server PID: `$(`$ServerProcess.Id)" -ForegroundColor Green
Write-Host "Waiting 10 seconds for server startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Checking if server is still running..." -ForegroundColor Yellow
if (Get-Process -Id `$ServerProcess.Id -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Server is running!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Server crashed or exited" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Log file: `$LogFile" -ForegroundColor Gray
Stop-Transcript
"@

$setupScriptPath = "$SandboxShare\Setup-SWEObeyMe.ps1"
$setupScriptContent | Out-File -FilePath $setupScriptPath -Force -Encoding UTF8

# 6. Create sandbox config
$sandboxConfig = @"
<Configuration>
  <VGpu>Enable</VGpu>
  <Networking>Enable</Networking>
  <MappedFolders>
    <MappedFolder>
      <HostFolder>$SandboxShare</HostFolder>
      <SandboxFolder>$SandboxInternalShare</SandboxFolder>
      <ReadOnly>false</ReadOnly>
    </MappedFolder>
  </MappedFolders>
  <LogonCommand>
    <Command>powershell.exe -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; cd $SandboxInternalShare; .\Setup-SWEObeyMe.ps1"</Command>
  </LogonCommand>
</Configuration>
"@

$sandboxConfigPath = "$ProjectRoot\swe-obeyme-test-sandbox.wsb"
$sandboxConfig | Out-File -FilePath $sandboxConfigPath -Force -Encoding UTF8

# 7. Launch sandbox
Write-Host "`nLaunching Windows Sandbox..." -ForegroundColor Yellow
Start-Process "C:\Windows\System32\WindowsSandbox.exe" -ArgumentList $sandboxConfigPath

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
