$ErrorActionPreference = "Stop"

Write-Host "Initializing git..."
git init

Write-Host "Configuring remote..."
try {
    git remote add origin https://github.com/firizpa-cyber/official-lumier1313
} catch {
    Write-Host "Remote origin already exists, updating URL..."
    git remote set-url origin https://github.com/firizpa-cyber/official-lumier1313
}

Write-Host "Staging files..."
git add .

Write-Host "Committing..."
try {
    git commit -m "Update project content"
} catch {
    Write-Host "Nothing to commit or commit failed."
}

Write-Host "Pushing to remote..."
try {
    git branch -M main
    git push -u origin main
} catch {
    Write-Host "Push to main failed, trying master..."
    git branch -M master
    git push -u origin master
}

Write-Host "Done."
