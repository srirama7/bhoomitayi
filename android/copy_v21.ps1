$apkSource = "C:\Users\amogh\bhoomitayi\android\app\build\outputs\apk\release\app-release.apk"
$aabSource = "C:\Users\amogh\bhoomitayi\android\app\build\outputs\bundle\release\app-release.aab"
$downloads = "C:\Users\amogh\Downloads"
$repoRoot = "C:\Users\amogh\bhoomitayi"

# Copy to repo root
Copy-Item $apkSource "$repoRoot\bhoomitayiv21.apk" -Force
Copy-Item $apkSource "$repoRoot\bhoomitayiv21-signed-release.apk" -Force
Copy-Item $apkSource "$repoRoot\BhoomiTayi.apk" -Force
Copy-Item $aabSource "$repoRoot\bhoomitayiv21playstore.aab" -Force

# Copy to Downloads directory
Copy-Item $apkSource "$downloads\bhoomitayiv21.apk" -Force
Copy-Item $apkSource "$downloads\bhoomitayiv21-signed-release.apk" -Force
Copy-Item $apkSource "$downloads\BhoomiTayi.apk" -Force
Copy-Item $aabSource "$downloads\bhoomitayiv21playstore.aab" -Force

Write-Host "=================== REPO ROOT FILES ==================="
Get-ChildItem "$repoRoot\bhoomitayiv21*.apk", "$repoRoot\bhoomitayiv21*.aab", "$repoRoot\BhoomiTayi.apk" | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | Format-Table -AutoSize

Write-Host "=================== DOWNLOADS FOLDER FILES ==================="
Get-ChildItem "$downloads\bhoomitayiv21*.apk", "$downloads\bhoomitayiv21*.aab", "$downloads\BhoomiTayi.apk" | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | Format-Table -AutoSize
