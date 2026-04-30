Set-Location "d:\SWEObeyMe-restored"

# Step 1: Check current status
$status = git status --short 2>$null
$lastCommit = git log --oneline -1 2>$null
$branches = git branch -a 2>$null

Write-Output "=== STATUS ==="
Write-Output $status
Write-Output "=== LAST COMMIT ==="
Write-Output $lastCommit
Write-Output "=== BRANCHES ==="
Write-Output $branches

# Step 2: If detached HEAD, create branch and checkout main
$head = git symbolic-ref HEAD 2>$null
if (-not $head) {
    Write-Output "=== DETACHED HEAD DETECTED ==="
    
    # Check if main exists
    $mainExists = git show-ref --verify --quiet refs/heads/main 2>$null
    if ($mainExists) {
        Write-Output "Branch 'main' exists"
        # Create temp branch at current commit
        git branch temp-commit-branch 2>$null
        # Checkout main
        git checkout main 2>$null
        # Merge our temp branch
        git merge temp-commit-branch --no-edit 2>$null
        # Delete temp branch
        git branch -d temp-commit-branch 2>$null
    } else {
        Write-Output "Branch 'main' does NOT exist"
        # Check if master exists
        $masterExists = git show-ref --verify --quiet refs/heads/master 2>$null
        if ($masterExists) {
            Write-Output "Using 'master' branch"
            git branch temp-commit-branch 2>$null
            git checkout master 2>$null
            git merge temp-commit-branch --no-edit 2>$null
            git branch -d temp-commit-branch 2>$null
        } else {
            Write-Output "No main or master found - creating main from current commit"
            git checkout -b main 2>$null
        }
    }
    
    Write-Output "=== AFTER FIX ==="
    Write-Output (git branch -v 2>$null)
    Write-Output (git log --oneline -3 2>$null)
} else {
    Write-Output "=== ON BRANCH: $head ==="
}
