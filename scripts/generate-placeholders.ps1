Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$outputDir = Join-Path $PSScriptRoot '..\public\images'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$assets = @(
  @{ Name = 'cover.png'; Title = 'OUR STORY'; Subtitle = 'a little world for two'; C1 = '#DFA8A8'; C2 = '#F4E7D4'; Accent = '#A95F68'; Wide = $true },
  @{ Name = 'first-meeting.png'; Title = 'FIRST HELLO'; Subtitle = 'coffee and a lovely beginning'; C1 = '#C8A98B'; C2 = '#F5EAD9'; Accent = '#735447'; Wide = $true },
  @{ Name = 'confession.png'; Title = 'THE YES DAY'; Subtitle = 'the day we became us'; C1 = '#DB9AA3'; C2 = '#F6DFD7'; Accent = '#A84F5E'; Wide = $true },
  @{ Name = 'trip.png'; Title = 'OUR TRIP'; Subtitle = 'collecting views together'; C1 = '#A8B8AE'; C2 = '#E8E3CC'; Accent = '#65786D'; Wide = $true },
  @{ Name = 'birthday.png'; Title = 'MAKE A WISH'; Subtitle = 'another year by your side'; C1 = '#D4A0AD'; C2 = '#F6E5C9'; Accent = '#A25565'; Wide = $true },
  @{ Name = 'daily-sunset.png'; Title = 'PINK SUNSET'; Subtitle = 'an ordinary lovely evening'; C1 = '#D99AA0'; C2 = '#F1CAA9'; Accent = '#A65C66'; Wide = $true },
  @{ Name = 'daily-rain.png'; Title = 'RAINY DAY'; Subtitle = 'home is wherever you are'; C1 = '#9EADB4'; C2 = '#E2D9CE'; Accent = '#65747B'; Wide = $true },
  @{ Name = 'gallery-sea.png'; Title = 'BY THE SEA'; Subtitle = 'wind, waves and us'; C1 = '#8FAEB2'; C2 = '#E9D9BA'; Accent = '#54777D'; Wide = $true },
  @{ Name = 'gallery-walk.png'; Title = 'SLOW WALK'; Subtitle = 'no destination needed'; C1 = '#AEB29A'; C2 = '#E9DCC6'; Accent = '#69705B'; Wide = $true },
  @{ Name = 'gallery-mountain.png'; Title = 'TO THE TOP'; Subtitle = 'one more view together'; C1 = '#889B8E'; C2 = '#D9D4BC'; Accent = '#53675A'; Wide = $true },
  @{ Name = 'gallery-cooking.png'; Title = 'DINNER FOR TWO'; Subtitle = 'made with a little love'; C1 = '#C99B7F'; C2 = '#F0DEC3'; Accent = '#875D49'; Wide = $true },
  @{ Name = 'avatar-one.png'; Title = 'HER'; Subtitle = 'replace with your photo'; C1 = '#D99AA3'; C2 = '#F2D9D2'; Accent = '#A15260'; Wide = $false },
  @{ Name = 'avatar-two.png'; Title = 'HIM'; Subtitle = 'replace with your photo'; C1 = '#9DAAA2'; C2 = '#E3DAC9'; Accent = '#627068'; Wide = $false }
)

foreach ($asset in $assets) {
  $width = if ($asset.Wide) { 1400 } else { 600 }
  $height = if ($asset.Wide) { 1000 } else { 600 }
  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
  $color1 = [System.Drawing.ColorTranslator]::FromHtml($asset.C1)
  $color2 = [System.Drawing.ColorTranslator]::FromHtml($asset.C2)
  $accent = [System.Drawing.ColorTranslator]::FromHtml($asset.Accent)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 35)
  $graphics.FillRectangle($gradient, $rect)

  $softWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 255, 255, 255))
  $softAccent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, $accent))
  $graphics.FillEllipse($softWhite, -120, -140, [int]($width * 0.55), [int]($width * 0.55))
  $graphics.FillEllipse($softAccent, [int]($width * 0.7), [int]($height * 0.58), [int]($width * 0.38), [int]($width * 0.38))

  $heartSize = if ($asset.Wide) { 125 } else { 92 }
  $heartX = [int](($width - $heartSize) / 2)
  $heartY = if ($asset.Wide) { [int]($height * 0.22) } else { [int]($height * 0.18) }
  $heartBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, $accent))
  $lobe = [int]($heartSize * 0.58)
  $graphics.FillEllipse($heartBrush, $heartX, $heartY, $lobe, $lobe)
  $graphics.FillEllipse($heartBrush, $heartX + [int]($heartSize * 0.42), $heartY, $lobe, $lobe)
  $points = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new([int]($heartX - 1), [int]($heartY + $heartSize * 0.34)),
    [System.Drawing.Point]::new([int]($heartX + $heartSize + 1), [int]($heartY + $heartSize * 0.34)),
    [System.Drawing.Point]::new([int]($heartX + $heartSize * 0.5), [int]($heartY + $heartSize * 1.12))
  )
  $graphics.FillPolygon($heartBrush, $points)

  $titleSize = if ($asset.Wide) { 58 } else { 44 }
  $subtitleSize = if ($asset.Wide) { 23 } else { 17 }
  $titleFont = New-Object System.Drawing.Font('Georgia', $titleSize, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font('Segoe UI', $subtitleSize, [System.Drawing.FontStyle]::Regular)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 78, 56, 47))
  $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(175, 78, 56, 47))
  $center = New-Object System.Drawing.StringFormat
  $center.Alignment = [System.Drawing.StringAlignment]::Center

  $titleY = if ($asset.Wide) { [int]($height * 0.49) } else { [int]($height * 0.52) }
  $titleRect = [System.Drawing.RectangleF]::new(0, $titleY, $width, 100)
  $subtitleRect = [System.Drawing.RectangleF]::new(0, [int]($titleY + 92), $width, 70)
  $graphics.DrawString($asset.Title, $titleFont, $textBrush, $titleRect, $center)
  $graphics.DrawString($asset.Subtitle, $subtitleFont, $subBrush, $subtitleRect, $center)

  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(100, $accent), 3)
  $lineWidth = if ($asset.Wide) { 310 } else { 180 }
  $lineY = $titleY + 180
  $graphics.DrawLine($linePen, [int](($width - $lineWidth) / 2), $lineY, [int](($width + $lineWidth) / 2), $lineY)

  $target = Join-Path $outputDir $asset.Name
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

  $linePen.Dispose()
  $center.Dispose()
  $subBrush.Dispose()
  $textBrush.Dispose()
  $subtitleFont.Dispose()
  $titleFont.Dispose()
  $heartBrush.Dispose()
  $softAccent.Dispose()
  $softWhite.Dispose()
  $gradient.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Created $($assets.Count) local placeholder images in $outputDir"
