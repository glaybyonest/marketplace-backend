Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$frontendPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'frontend'
Push-Location $frontendPath
try {
  npm run dev
}
finally {
  Pop-Location
}
