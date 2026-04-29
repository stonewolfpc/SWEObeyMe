#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Dumps SWEObeyMe project code to 3 evenly split text files

.DESCRIPTION
    Scans the project directory, reads all code files (excluding dependencies and archives),
    and splits the content into 3 roughly equal text files for external AI review.
#>

param(
    [string]$ProjectPath = "d:\SWEObeyMe-restored",
    [string]$OutputDir = "d:\SWEObeyMe-restored",
    [string]$BaseName = "sweobeyme-dump"
)

# Exclude patterns
$excludePatterns = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    ".vscode",
    ".windsurf",
    "coverage",
    ".nyc_output",
    "*.log",
    "*.tmp",
    "*.cache",
    "ares-rig",
    "windsurf-rig",
    "fdq_corpus",
    "testing_qa_corpus",
    "enterprise_security_corpus",
    "build_deployment_corpus",
    "csharp_dotnet_corpus",
    "ide_mcp_corpus",
    "mcp_implementation_corpus",
    "corpus",
    "test-tools",
    "sweobeyme-tools",
    "*.md",
    "*.json",
    "*.yaml",
    "*.yml",
    "*.txt",
    "*.html",
    "*.css",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.svg",
    "*.ico",
    "*.lock",
    ".local"
)

# Include patterns (code files only)
$includePatterns = @(
    "*.js",
    "*.ts",
    "*.jsx",
    "*.tsx",
    "*.cjs",
    "*.mjs",
    "*.py",
    "*.cs",
    "*.cpp",
    "*.h",
    "*.hpp",
    "*.java",
    "*.go",
    "*.rs",
    "*.rb",
    "*.php",
    "*.sh",
    "*.bat",
    "*.ps1"
)

Write-Host "Starting code dump for: $ProjectPath" -ForegroundColor Cyan

# Get all code files
$allFiles = Get-ChildItem -Path $ProjectPath -Recurse -File | Where-Object {
    $file = $_
    $excludeMatch = $false
    
    # Check exclude patterns
    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like "*$pattern*" -or $file.Name -like $pattern) {
            $excludeMatch = $true
            break
        }
    }
    
    # Check include patterns
    $includeMatch = $false
    foreach ($pattern in $includePatterns) {
        if ($file.Name -like $pattern) {
            $includeMatch = $true
            break
        }
    }
    
    -not $excludeMatch -and $includeMatch
}

Write-Host "Found $($allFiles.Count) code files to process" -ForegroundColor Green

# Read all file contents
$fileContents = @()
$progress = 0
$totalFiles = $allFiles.Count

foreach ($file in $allFiles) {
    $progress++
    Write-Progress -Activity "Reading files" -Status "$progress of $totalFiles" -PercentComplete (($progress / $totalFiles) * 100)
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        if ($content) {
            $relativePath = $file.FullName.Replace($ProjectPath, "").TrimStart("\", "/")
            $fileContents += @(
                "=== FILE: $relativePath ==="
                $content
                ""
            )
        }
    } catch {
        Write-Host "Failed to read: $($file.FullName)" -ForegroundColor Yellow
    }
}

Write-Progress -Activity "Reading files" -Completed

$totalContent = $fileContents -join "`n"
$totalLines = ($totalContent -split "`n").Count
$linesPerFile = [Math]::Ceiling($totalLines / 3)

Write-Host "Total lines: $totalLines" -ForegroundColor Cyan
Write-Host "Lines per file: $linesPerFile" -ForegroundColor Cyan

# Split into 3 parts
$allLines = $totalContent -split "`n"
$part1 = $allLines[0..($linesPerFile - 1)] -join "`n"
$part2 = $allLines[$linesPerFile..(2 * $linesPerFile - 1)] -join "`n"
$part3 = $allLines[(2 * $linesPerFile)..($allLines.Count - 1)] -join "`n"

# Write to files
$outputPath1 = Join-Path $OutputDir "$BaseName-part1.txt"
$outputPath2 = Join-Path $OutputDir "$BaseName-part2.txt"
$outputPath3 = Join-Path $OutputDir "$BaseName-part3.txt"

Write-Host "Writing to: $outputPath1" -ForegroundColor Cyan
Set-Content -Path $outputPath1 -Value $part1 -Encoding UTF8

Write-Host "Writing to: $outputPath2" -ForegroundColor Cyan
Set-Content -Path $outputPath2 -Value $part2 -Encoding UTF8

Write-Host "Writing to: $outputPath3" -ForegroundColor Cyan
Set-Content -Path $outputPath3 -Value $part3 -Encoding UTF8

Write-Host "Done! Created 3 dump files:" -ForegroundColor Green
Write-Host "  - $outputPath1" -ForegroundColor White
Write-Host "  - $outputPath2" -ForegroundColor White
Write-Host "  - $outputPath3" -ForegroundColor White
