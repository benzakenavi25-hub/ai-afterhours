$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Set-Location $PSScriptRoot

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "חסר GitHub CLI (gh). התקינו מ: https://cli.github.com/"
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "צריך התחברות חד-פעמית ל-GitHub CLI."
  Write-Host "מריצים: gh auth login -h github.com -p https -w"
  gh auth login -h github.com -p https -w
}

if (-not (Test-Path ".git")) {
  git init -b main
  git add -A
  git commit -m "Initial commit: AI AfterHours site"
}

$repoName = "ai-afterhours"
$user = gh api user -q .login
$remote = git remote get-url origin 2>$null

if (-not $remote) {
  gh repo create $repoName --public --source=. --remote=origin --push
} else {
  git push -u origin main
}

gh api "repos/$user/$repoName/pages" -X POST -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh api "repos/$user/$repoName/pages" -X PUT -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" | Out-Null
}

$url = "https://$user.github.io/$repoName/"
Write-Host ""
Write-Host "האתר יהיה זמין בקישור (לוקח 1–3 דקות):"
Write-Host $url
Write-Host ""
Start-Process $url
