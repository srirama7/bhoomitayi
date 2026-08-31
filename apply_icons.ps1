Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\amogh\Downloads\cropped_circle_image.png"
$resBase = "C:\Users\amogh\bhoomitayi\android\app\src\main\res"

$densities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$source = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($entry in $densities.GetEnumerator()) {
    $dir  = Join-Path $resBase $entry.Key
    $size = $entry.Value

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($source, 0, 0, $size, $size)
    $g.Dispose()

    $iconNames = @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")
    foreach ($iconName in $iconNames) {
        $outPath = Join-Path $dir $iconName
        $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host ("Saved: " + $outPath)
    }
    $bmp.Dispose()
}

$source.Dispose()
Write-Host "All icons applied successfully."
