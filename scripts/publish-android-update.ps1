$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$packageJson = Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json
$version = $packageJson.version
$sourceApk = Join-Path $projectRoot "release-output\YG-Little-World-v$version.apk"
$updateDirectory = Join-Path $projectRoot 'public\app-updates'
$targetApk = Join-Path $updateDirectory 'YG-Little-World-latest.apk'
$manifestPath = Join-Path $updateDirectory 'latest.json'

if (-not (Test-Path -LiteralPath $sourceApk)) {
  throw "Release APK not found: $sourceApk"
}

$gradle = Get-Content (Join-Path $projectRoot 'android\app\build.gradle') -Raw
$versionCodeMatch = [regex]::Match($gradle, 'versionCode\s+(\d+)')
if (-not $versionCodeMatch.Success) {
  throw 'versionCode was not found in android/app/build.gradle.'
}

New-Item -ItemType Directory -Path $updateDirectory -Force | Out-Null
Copy-Item -LiteralPath $sourceApk -Destination $targetApk -Force
$file = Get-Item -LiteralPath $targetApk
$stream = [System.IO.File]::OpenRead($targetApk)
try {
  $sha256 = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = ([System.BitConverter]::ToString($sha256.ComputeHash($stream)) -replace '-', '').ToLowerInvariant()
  }
  finally {
    $sha256.Dispose()
  }
}
finally {
  $stream.Dispose()
}
$existing = if (Test-Path -LiteralPath $manifestPath) {
  [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
} else {
  $null
}

$manifest = [ordered]@{
  version = $version
  versionCode = [int]$versionCodeMatch.Groups[1].Value
  downloadUrl = 'https://yg1224.com/app-updates/YG-Little-World-latest.apk'
  notes = if ($existing.notes) { $existing.notes } else { 'New features and stability improvements.' }
  publishedAt = (Get-Date).ToUniversalTime().ToString('o')
  size = $file.Length
  sha256 = $hash
}

$json = $manifest | ConvertTo-Json
[System.IO.File]::WriteAllText($manifestPath, "$json`n", [System.Text.UTF8Encoding]::new($false))
Write-Output "Update files prepared: $updateDirectory"
