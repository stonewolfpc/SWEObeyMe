# SWEObeyMe Project Dump Script
# Dumps all project files to a single text file (excluding large binaries)

$projectPath = "."
$outputFile = "SWEObeyMe_Project_Dump.txt"
$excludePatterns = @(
    "*.exe", "*.dll", "*.so", "*.dylib",
    "node_modules/**/*", "dist/**/*", 
    "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico",
    "*.zip", "*.tar", "*.gz", "*.vsix",
    ".git/**/*", "*.log"
)

Write-Host "Creating project dump..." -ForegroundColor Green

# Remove existing dump file
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
}

# Add header
Add-Content -Path $outputFile -Value "=" * 80
Add-Content -Path $outputFile -Value "SWEObeyMe Project Dump"
Add-Content -Path $outputFile -Value "Generated: $(Get-Date)"
Add-Content -Path $outputFile -Value "=" * 80
Add-Content -Path $outputFile -Value ""

# Get all files recursively
$files = Get-ChildItem -Path $projectPath -Recurse -File | Where-Object {
    $file = $_
    # Skip excluded patterns
    $shouldInclude = $true
    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -like $pattern -or $file.Name -like $pattern) {
            $shouldInclude = $false
            break
        }
    }
    $shouldInclude
} | Sort-Object FullName

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart("\")
    
    Add-Content -Path $outputFile -Value ""
    Add-Content -Path $outputFile -Value "=" * 80
    Add-Content -Path $outputFile -Value "File: $relativePath"
    Add-Content -Path $outputFile -Value "Size: $([math]::Round($file.Length / 1KB, 2)) KB"
    Add-Content -Path $outputFile -Value "Modified: $($file.LastWriteTime)"
    Add-Content -Path $outputFile -Value "=" * 80
    Add-Content -Path $outputFile -Value ""
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Add line numbers
            $lines = $content -split "`n"
            $lineNumber = 1
            foreach ($line in $lines) {
                Add-Content -Path $outputFile -Value "$($lineNumber.ToString().PadLeft(4)): $line"
                $lineNumber++
            }
        } else {
            Add-Content -Path $outputFile -Value "[Binary file or empty file]"
        }
    } catch {
        Add-Content -Path $outputFile -Value "[Error reading file: $($_.Exception.Message)]"
    }
    
    Add-Content -Path $outputFile -Value ""
    Add-Content -Path $outputFile -Value ""
}

Write-Host "Project dump created: $outputFile" -ForegroundColor Green
Write-Host "Total files processed: $($files.Count)" -ForegroundColor Green
Write-Host "Dump size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Green
