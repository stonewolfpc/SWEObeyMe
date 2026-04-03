# PowerShell script to dump SWEObeyMe project source files into organized text files
# This script creates 3 separate dump files for better organization

$projectRoot = "d:\SWEObeyMe-restored"
$outputDir = $projectRoot

# File 1: Core JavaScript files (main application files)
$coreJsFiles = @(
    "index.js",
    "extension.js", 
    "lib\backup.js",
    "lib\comparison.js",
    "lib\config.js",
    "lib\context.js",
    "lib\documentation.js",
    "lib\enforcement.js",
    "lib\feedback.js",
    "lib\file-operation-audit.js",
    "lib\file-registry.js",
    "lib\guardrails.js",
    "lib\math-safety.js",
    "lib\project.js",
    "lib\reference-validation.js",
    "lib\safety.js",
    "lib\session.js",
    "lib\testing.js",
    "lib\tools.js",
    "lib\utils.js",
    "lib\validation.js",
    "lib\verification.js",
    "lib\workflow.js",
    "lib\tools\config-handlers.js",
    "lib\tools\context-handlers.js",
    "lib\tools\csharp-handlers.js",
    "lib\tools\feedback-handlers.js",
    "lib\tools\handlers.js",
    "lib\tools\project-integrity-handlers.js",
    "lib\tools\registry.js",
    "lib\tools\safety-handlers.js",
    "lib\tools\validation-handlers.js",
    "utils\context-memory.js",
    "scripts\release.js"
)

# File 2: Configuration and documentation files
$configDocFiles = @(
    "package.json",
    "extension-package.json",
    "tsconfig.json",
    "windsurf-mcp.json",
    ".eslintrc.js",
    ".prettierrc.json",
    ".gitignore",
    ".vscodeignore",
    ".sweignore",
    ".cz-config.js",
    ".czrc.json",
    ".lintstagedrc.json",
    ".versionrc.json",
    "commitlint.config.js",
    "jest.config.js",
    "README.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "BRANCHING.md",
    "HOTFIX.md",
    "PUBLISH.md",
    "RELEASE_MANAGEMENT.md",
    "LICENSE",
    "icon.png"
)

# File 3: Test files and miscellaneous
$testMiscFiles = @(
    "__tests__\server.test.js",
    "__tests__\utils.test.js",
    "test.cs",
    "test-mcp-server.js",
    "test-mcp-protocol-compliance.js",
    "quotes.js",
    "setup.bat",
    "resize-icon.ps1",
    "index.mjs",
    ".github\workflows\ci.yml",
    ".github\workflows\hotfix.yml", 
    ".github\workflows\release.yml",
    ".github\PULL_REQUEST_TEMPLATE.md",
    ".husky\commit-msg",
    ".husky\pre-commit"
)

# Function to write file header and content
function Write-FileContent {
    param(
        [string]$OutputPath,
        [string[]]$Files,
        [string]$Description
    )
    
    Write-Host "Creating $Description dump: $OutputPath"
    
    # Clear existing file or create new one
    Set-Content -Path $OutputPath -Value ""
    
    # Add header
    Add-Content -Path $OutputPath -Value "=================================================================="
    Add-Content -Path $OutputPath -Value "$Description"
    Add-Content -Path $OutputPath -Value "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Add-Content -Path $OutputPath -Value "Project: SWEObeyMe"
    Add-Content -Path $OutputPath -Value "=================================================================="
    Add-Content -Path $OutputPath -Value ""
    
    # Process each file
    foreach ($file in $Files) {
        $fullPath = Join-Path $projectRoot $file
        
        if (Test-Path $fullPath) {
            Add-Content -Path $OutputPath -Value "------------------------------------------------------------------"
            Add-Content -Path $OutputPath -Value "FILE: $file"
            Add-Content -Path $OutputPath -Value "SIZE: $((Get-Item $fullPath).Length) bytes"
            Add-Content -Path $OutputPath -Value "MODIFIED: $(Get-Item $fullPath).LastWriteTime"
            Add-Content -Path $OutputPath -Value "------------------------------------------------------------------"
            Add-Content -Path $OutputPath -Value ""
            
            try {
                $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
                if ($content) {
                    Add-Content -Path $OutputPath -Value $content
                } else {
                    Add-Content -Path $OutputPath -Value "[EMPTY FILE]"
                }
            } catch {
                Add-Content -Path $OutputPath -Value "[ERROR READING FILE: $($_.Exception.Message)]"
            }
            
            Add-Content -Path $OutputPath -Value ""
            Add-Content -Path $OutputPath -Value ""
        } else {
            Add-Content -Path $OutputPath -Value "------------------------------------------------------------------"
            Add-Content -Path $OutputPath -Value "FILE: $file [NOT FOUND]"
            Add-Content -Path $OutputPath -Value "------------------------------------------------------------------"
            Add-Content -Path $OutputPath -Value ""
        }
    }
    
    Write-Host "Completed: $OutputPath ($((Get-Item $OutputPath).Length) bytes)"
}

# Execute the dumps
Write-Host "Starting SWEObeyMe source file dump process..."
Write-Host ""

# Dump 1: Core JavaScript files
Write-FileContent -OutputPath "$outputDir\dump-1-core-javascript.txt" -Files $coreJsFiles -Description "Core JavaScript Files"

# Dump 2: Configuration and documentation files  
Write-FileContent -OutputPath "$outputDir\dump-2-config-docs.txt" -Files $configDocFiles -Description "Configuration and Documentation Files"

# Dump 3: Test files and miscellaneous
Write-FileContent -OutputPath "$outputDir\dump-3-tests-misc.txt" -Files $testMiscFiles -Description "Test Files and Miscellaneous"

Write-Host ""
Write-Host "Dump process completed!"
Write-Host "Generated files:"
Write-Host "- dump-1-core-javascript.txt (Core application files)"
Write-Host "- dump-2-config-docs.txt (Configuration and documentation)"  
Write-Host "- dump-3-tests-misc.txt (Test files and miscellaneous)"
