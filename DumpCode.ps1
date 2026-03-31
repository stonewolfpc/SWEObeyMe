# ================== CONFIG ==================
$rootDir        = "."
$outputPrefix   = "SWEObeyMe_Project_Dump"
$totalParts     = 5

# Hard external limit (what you care about)
$maxPartSizeKB  = 450

# Internal packing limit to leave headroom for headers/footers/encoding
$packingHeadroomKB = 10      # tweak this if you like
$effectiveMaxKB    = $maxPartSizeKB - $packingHeadroomKB
$effectiveMaxB     = $effectiveMaxKB * 1KB

# 1. Source Code Only Whitelist (Strict project files only)
$allowedExtensions = @(
    ".js", ".mjs", ".cjs", ".ts",
    ".json", ".md", ".txt", ".xml",
    ".config", ".yml", ".yaml",
    ".ps1", ".bat", ".sh",
    ".html", ".css"
)

# 2. Comprehensive Exclusion Paths (All non-source content)
$absoluteExcludePaths = @(
    "*\node_modules*",
    "*\dist*",
    "*\.sweobeyme-backups*",
    "*\.swe-memory*",
    "*\.git*",
    "*\.vs*",
    "*\.vscode*",

    "*\bin*",
    "*\obj*",
    "*\build*",
    "*\out*",

    "*\cache*",
    "*\tmp*",
    "*\temp*",
    "*\.cache*",
    "*\.temp*",

    "*.exe",
    "*.dll",
    "*.so",
    "*.dylib",

    "*\backup*",
    "*\backups*",
    "*\.backup*",
    "*.zip",
    "*.tar",
    "*.rar",
    "*.7z",
    "*.vsix",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.ico",

    "*\logs*",
    "*\.log*",
    "*.log",

    # Precise exclusions for SWEObeyMe
    "*\utils*",
    "*test*.js",
    "*final-test*",
    "*simple-test*",
    "*test-*.js",
    "*auto-correct*",
    "*test-source*",
    "*test-utils*",

    "*$outputPrefix*",
    "*\Dump*",
    "*\dump*",
    "*\SWEObeyMe_Project_Dump*",
    "*create_project_dump*"
)

Write-Host "Scanning directory: $rootDir..." -ForegroundColor Cyan

# 3. Gather files with strict filtering
$allFiles = Get-ChildItem -Path $rootDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $path   = $_.FullName
    $ext    = $_.Extension.ToLower()
    $sizeKB = $_.Length / 1KB

    $isAllowedType = $allowedExtensions -contains $ext
    $isExcluded    = $false

    foreach ($exclude in $absoluteExcludePaths) {
        if ($path -like $exclude) { $isExcluded = $true; break }
    }

    # Per-file cap to avoid monsters
    $isProcessable = $sizeKB -lt 3000

    $isAllowedType -and -not $isExcluded -and $isProcessable
}

if (-not $allFiles -or $allFiles.Count -eq 0) {
    Write-Host "No eligible files found under $rootDir." -ForegroundColor Yellow
    return
}

# 4. Size Health Check
$totalSizeMB = ($allFiles | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("TOTAL SOURCE SIZE: {0:N2} MB" -f $totalSizeMB) -ForegroundColor Green

# 5. Sort files by size (descending) for better packing
$sortedFiles = $allFiles | Sort-Object -Property Length -Descending

# 6. Initialize parts
$parts = @()
for ($i = 0; $i -lt $totalParts; $i++) {
    $parts += [PSCustomObject]@{
        Files       = New-Object System.Collections.Generic.List[System.IO.FileInfo]
        CurrentSize = 0L
    }
}

# 7. Greedy packing with hard internal per-part size target
$currentPartIndex = 0

foreach ($file in $sortedFiles) {
    $fileSize = $file.Length

    if ($fileSize -gt $effectiveMaxB) {
        Write-Host ("WARNING: Skipping {0} ({1:N2} KB) - exceeds internal per-part limit of {2} KB" -f `
            $file.FullName, ($fileSize / 1KB), $effectiveMaxKB) -ForegroundColor Red
        continue
    }

    if ($parts[$currentPartIndex].CurrentSize + $fileSize -gt $effectiveMaxB) {
        if ($currentPartIndex -lt ($totalParts - 1)) {
            $currentPartIndex++
        } else {
            Write-Host ("WARNING: Out of parts. Forcing {0} into last part; it may approach {1} KB." -f `
                $file.FullName, $maxPartSizeKB) -ForegroundColor Yellow
        }
    }

    $parts[$currentPartIndex].Files.Add($file)
    $parts[$currentPartIndex].CurrentSize += $fileSize
}

# 8. Generate dump files
for ($i = 0; $i -lt $totalParts; $i++) {
    $partNumber = $i + 1
    $outputFile = Join-Path $rootDir "$outputPrefix`_Part$partNumber.txt"
    $batch      = $parts[$i].Files

    if ($batch.Count -eq 0) {
        "--- PART $partNumber OF $totalParts (EMPTY) ---" | Out-File -FilePath $outputFile -Encoding utf8
        Write-Host "Part $partNumber is empty." -ForegroundColor DarkGray
        continue
    }

    "--- PART $partNumber OF $totalParts ---" | Out-File -FilePath $outputFile -Encoding utf8
    "PART SIZE (ESTIMATED RAW): {0:N2} KB ({1} files)" -f ($parts[$i].CurrentSize / 1KB), $batch.Count |
        Out-File -FilePath $outputFile -Append -Encoding utf8

    foreach ($file in $batch) {
        $fileLines = (Get-Content -Path $file.FullName).Count

        $header  = "`n`n[FILE_START: $($file.FullName)]`n"
        $header += "[LINE_COUNT: $fileLines]`n"
        $header  | Out-File -FilePath $outputFile -Append -Encoding utf8

        try {
            $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
            $content | Out-File -FilePath $outputFile -Append -Encoding utf8
        } catch {
            "[[ ERROR: Surgical failure reading $($file.Name) ]]" |
                Out-File -FilePath $outputFile -Append -Encoding utf8
        }

        "`n[FILE_END: $($file.FullName)]" | Out-File -FilePath $outputFile -Append -Encoding utf8
    }

    $finalSizeKB = ((Get-Item $outputFile).Length / 1KB)
    if ($finalSizeKB -gt $maxPartSizeKB) {
        Write-Host ("WARNING: Part {0} exceeds {1} KB (actual: {2:N2} KB)" -f `
            $partNumber, $maxPartSizeKB, $finalSizeKB) -ForegroundColor Red
    } else {
        Write-Host ("Part {0} OK ({1:N2} KB)" -f $partNumber, $finalSizeKB) -ForegroundColor Yellow
    }
}