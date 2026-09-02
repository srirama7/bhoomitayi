const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// PowerShell script using System.Drawing to do high-quality resizing
const psScript = `
Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\\Users\\amogh\\Downloads\\cropped_circle_image.png"
$resBase = "C:\\Users\\amogh\\bhoomitayi\\android\\app\\src\\main\\res"
$publicDir = "C:\\Users\\amogh\\bhoomitayi\\public"
$srcAppDir = "C:\\Users\\amogh\\bhoomitayi\\src\\app"

$source = [System.Drawing.Image]::FromFile($sourcePath)

# 1. Android Adaptive Foreground (108dp canvas, ~70% safe zone centered so it never gets clipped)
$fgDensities = @{
    "mipmap-mdpi"    = @{ Canvas = 108; Inner = 76 }
    "mipmap-hdpi"    = @{ Canvas = 162; Inner = 114 }
    "mipmap-xhdpi"   = @{ Canvas = 216; Inner = 152 }
    "mipmap-xxhdpi"  = @{ Canvas = 324; Inner = 228 }
    "mipmap-xxxhdpi" = @{ Canvas = 432; Inner = 304 }
}

foreach ($entry in $fgDensities.GetEnumerator()) {
    $dir = Join-Path $resBase $entry.Key
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $canvasSize = $entry.Value.Canvas
    $innerSize  = $entry.Value.Inner
    $offset     = [int](($canvasSize - $innerSize) / 2)

    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $g.DrawImage($source, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()

    $outPath = Join-Path $dir "ic_launcher_foreground.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated Foreground: $outPath"
}

# 2. Android Legacy Icons (ic_launcher.png & ic_launcher_round.png)
$legacyDensities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($entry in $legacyDensities.GetEnumerator()) {
    $dir  = Join-Path $resBase $entry.Key
    $size = $entry.Value

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $size, $size)
    $g.Dispose()

    foreach ($iconName in @("ic_launcher.png", "ic_launcher_round.png")) {
        $outPath = Join-Path $dir $iconName
        $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Generated Legacy: $outPath"
    }
    $bmp.Dispose()
}

# 3. Web and App Icons
$webIcons = @(
    @{ Path = (Join-Path $publicDir "icon.png"); Size = 512 },
    @{ Path = (Join-Path $publicDir "app-icon.png"); Size = 512 },
    @{ Path = (Join-Path $publicDir "logo-v2.png"); Size = 512 },
    @{ Path = (Join-Path $publicDir "logo.png"); Size = 512 },
    @{ Path = (Join-Path $publicDir "apple-icon.png"); Size = 180 },
    @{ Path = (Join-Path $srcAppDir "icon.png"); Size = 512 },
    @{ Path = (Join-Path $srcAppDir "apple-icon.png"); Size = 180 }
)

foreach ($item in $webIcons) {
    $size = $item.Size
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($source, 0, 0, $size, $size)
    $g.Dispose()

    $bmp.Save($item.Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated Web Icon: $($item.Path)"
}

$source.Dispose()
Write-Host "All icons created successfully!"
`;

fs.writeFileSync(path.join(__dirname, 'generate_icons.ps1'), psScript);
console.log('Script written to generate_icons.ps1');
