param(
  [Parameter(Mandatory=$true)]
  [string]$HostName,

  [string]$SshUser = "opc",

  [string]$KeyPath = "$HOME\.ssh\suzuki_oracle_vps_ed25519",

  [string]$RemoteDir = "/opt/suzuki-cello-school",

  [string]$AppDomain = "app.suzukicello.ch",

  [string]$PublicAppOrigin = "",

  [string]$MediaUpstream = "suzuki-cello-school.pages.dev",

  [string]$AdminEmail = "teacher@example.com"
)

$ErrorActionPreference = "Stop"

if (-not $PublicAppOrigin) {
  $PublicAppOrigin = "https://$AppDomain"
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "SSH key was not found: $KeyPath"
}

$archive = Join-Path $env:TEMP "suzuki-cello-school-deploy.tar.gz"
$sshTarget = "${SshUser}@${HostName}"

function Invoke-Ssh([string]$Command) {
  ssh -i $KeyPath -o StrictHostKeyChecking=accept-new $sshTarget $Command
  if ($LASTEXITCODE -ne 0) { throw "Remote command failed: $Command" }
}

Write-Host "Creating deploy archive..."
if (Test-Path -LiteralPath $archive) {
  Remove-Item -LiteralPath $archive -Force
}

tar `
  --exclude ".git" `
  --exclude ".wrangler" `
  --exclude "node_modules" `
  --exclude "server/node_modules" `
  --exclude "dist" `
  --exclude "backups" `
  --exclude "src/books" `
  --exclude "src/mp3" `
  --exclude "src/video" `
  -czf $archive .
if ($LASTEXITCODE -ne 0) { throw "Creating the archive failed" }

Write-Host "Preparing remote directory..."
Invoke-Ssh "sudo mkdir -p '$RemoteDir' && sudo chown `$USER:`$USER '$RemoteDir'"

# First deploy = no .env on the server yet. Secrets are generated once and
# then preserved forever: regenerating POSTGRES_PASSWORD on a re-deploy would
# strand the app, because the Postgres volume keeps the original password.
Write-Host "Checking for existing environment..."
$envExists = (ssh -i $KeyPath $sshTarget "test -f '$RemoteDir/.env' && echo yes || echo no").Trim()
$firstDeploy = $envExists -ne "yes"

Write-Host "Uploading project..."
scp -i $KeyPath $archive "${sshTarget}:/tmp/suzuki-cello-school-deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "Upload failed" }

Write-Host "Extracting project on VPS (preserving .env and backups)..."
Invoke-Ssh "cd '$RemoteDir' && find . -mindepth 1 -maxdepth 1 ! -name '.env' ! -name 'backups' -exec rm -rf {} + && tar -xzf /tmp/suzuki-cello-school-deploy.tar.gz -C '$RemoteDir' && rm /tmp/suzuki-cello-school-deploy.tar.gz"

Write-Host "Installing Docker if needed..."
Invoke-Ssh "cd '$RemoteDir' && sh ops/provision-vps.sh"

if ($firstDeploy) {
  Write-Host "First deploy: generating secrets and admin credentials..."
  $securePassword = Read-Host -AsSecureString "Choose a password for the teacher admin ($AdminEmail)"
  $adminPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
  if (-not $adminPassword) { throw "Admin password must not be empty" }

  $postgresPassword = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
  $sessionSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

  $envFile = @"
APP_DOMAIN=$AppDomain
PUBLIC_APP_ORIGIN=$PublicAppOrigin

POSTGRES_DB=suzuki_cello
POSTGRES_USER=suzuki
POSTGRES_PASSWORD=$postgresPassword

SESSION_SECRET=$sessionSecret

ADMIN_EMAIL=$AdminEmail
ADMIN_PASSWORD=$adminPassword
ADMIN_NAME=Teacher

MEDIA_UPSTREAM=$MediaUpstream
"@

  $localEnv = Join-Path $env:TEMP "suzuki-cello-school.env"
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($localEnv, $envFile, $utf8NoBom)

  Write-Host "Uploading production environment..."
  scp -i $KeyPath $localEnv "${sshTarget}:${RemoteDir}/.env"
  if ($LASTEXITCODE -ne 0) { throw "Uploading .env failed" }
  Remove-Item -LiteralPath $localEnv -Force
} else {
  Write-Host "Re-deploy: keeping the existing .env (secrets unchanged)."
}

Write-Host "Starting stack..."
Invoke-Ssh "cd '$RemoteDir' && sudo docker compose up -d --build"

Write-Host "Running database migration..."
Invoke-Ssh "cd '$RemoteDir' && set -a && . ./.env && set +a && sudo -E docker compose exec -T postgres psql -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" < server/migrations/001_init.sql"

if ($firstDeploy) {
  Write-Host "Creating teacher admin..."
  Invoke-Ssh "cd '$RemoteDir' && sudo docker compose exec app sh -lc 'cd /app/server && npm run create-admin'"
}

Write-Host "Checking health..."
Invoke-Ssh "cd '$RemoteDir' && sudo docker compose ps && curl -fsS http://127.0.0.1:3000/api/health"

Write-Host "Deploy finished: $PublicAppOrigin"
