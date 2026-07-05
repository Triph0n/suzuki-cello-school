param(
  [Parameter(Mandatory=$true)]
  [string]$HostName,

  [string]$SshUser = "opc",

  [string]$KeyPath = "$HOME\.ssh\suzuki_oracle_vps_ed25519",

  [string]$RemoteDir = "/opt/suzuki-cello-school",

  [string]$AppDomain = "app.suzukicello.ch",

  [string]$PublicAppOrigin = "",

  [string]$AdminEmail = "teacher@example.com",

  [Parameter(Mandatory=$true)]
  [string]$AdminPassword
)

$ErrorActionPreference = "Stop"

if (-not $PublicAppOrigin) {
  $PublicAppOrigin = "https://$AppDomain"
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "SSH key was not found: $KeyPath"
}

$postgresPassword = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(36))
$sessionSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$archive = Join-Path $env:TEMP "suzuki-cello-school-deploy.tar.gz"
$sshTarget = "${SshUser}@${HostName}"

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
  --exclude "src/books" `
  --exclude "src/mp3" `
  --exclude "src/video" `
  -czf $archive .

Write-Host "Preparing remote directory..."
ssh -i $KeyPath -o StrictHostKeyChecking=accept-new $sshTarget "sudo mkdir -p '$RemoteDir' && sudo chown `$USER:`$USER '$RemoteDir'"

Write-Host "Uploading project..."
scp -i $KeyPath $archive "${sshTarget}:/tmp/suzuki-cello-school-deploy.tar.gz"

Write-Host "Extracting project on VPS..."
ssh -i $KeyPath $sshTarget "rm -rf '$RemoteDir'/* && tar -xzf /tmp/suzuki-cello-school-deploy.tar.gz -C '$RemoteDir'"

Write-Host "Installing Docker if needed..."
ssh -i $KeyPath $sshTarget "cd '$RemoteDir' && sh ops/provision-vps.sh"

$envFile = @"
APP_DOMAIN=$AppDomain
PUBLIC_APP_ORIGIN=$PublicAppOrigin

POSTGRES_DB=suzuki_cello
POSTGRES_USER=suzuki
POSTGRES_PASSWORD=$postgresPassword

SESSION_SECRET=$sessionSecret

ADMIN_EMAIL=$AdminEmail
ADMIN_PASSWORD=$AdminPassword
ADMIN_NAME=Teacher

MEDIA_BASE_URL=https://suzuki-cello-school.pages.dev/api/media
"@

$localEnv = Join-Path $env:TEMP "suzuki-cello-school.env"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localEnv, $envFile, $utf8NoBom)

Write-Host "Uploading production environment..."
scp -i $KeyPath $localEnv "${sshTarget}:${RemoteDir}/.env"

Write-Host "Starting stack..."
ssh -i $KeyPath $sshTarget "cd '$RemoteDir' && sudo docker compose up -d --build"

Write-Host "Running database migration..."
ssh -i $KeyPath $sshTarget "cd '$RemoteDir' && sudo docker compose exec -T postgres psql -U suzuki -d suzuki_cello < server/migrations/001_init.sql"

Write-Host "Creating teacher admin..."
ssh -i $KeyPath $sshTarget "cd '$RemoteDir' && sudo docker compose exec app sh -lc 'cd /app/server && npm run create-admin'"

Write-Host "Checking health..."
ssh -i $KeyPath $sshTarget "cd '$RemoteDir' && sudo docker compose ps && curl -fsS http://127.0.0.1:3000/api/health"

Write-Host "Deploy finished: $PublicAppOrigin"
