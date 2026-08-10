$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$jdk = Get-ChildItem -Path 'C:\Program Files\Microsoft\jdk-21*' -Directory |
  Sort-Object Name -Descending |
  Select-Object -First 1

if (-not $jdk) {
  throw 'Java 21 was not found. Install Microsoft OpenJDK 21 first.'
}

$env:JAVA_HOME = $jdk.FullName
$env:ANDROID_HOME = 'C:\Users\Administrator\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "C:\Program Files\nodejs;$($env:JAVA_HOME)\bin;$env:Path"

Push-Location $projectRoot
try {
  & 'C:\Program Files\nodejs\npm.cmd' run app:sync
  if ($LASTEXITCODE -ne 0) { throw 'Web asset sync failed.' }

  Push-Location (Join-Path $projectRoot 'android')
  try {
    & '.\gradlew.bat' assembleRelease bundleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
  }
  finally {
    Pop-Location
  }

  $version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
  $outputDirectory = Join-Path $projectRoot 'release-output'
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  Copy-Item (Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk') (Join-Path $outputDirectory "YG-Little-World-v$version.apk") -Force
  Copy-Item (Join-Path $projectRoot 'android\app\build\outputs\bundle\release\app-release.aab') (Join-Path $outputDirectory "YG-Little-World-v$version.aab") -Force
  Write-Output "Release packages created: $outputDirectory"
}
finally {
  Pop-Location
}
