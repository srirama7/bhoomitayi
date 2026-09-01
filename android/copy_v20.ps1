$apkSource = "C:\Users\amogh\bhoomitayi\android\app\build\outputs\apk\release\app-release.apk"
$aabSource = "C:\Users\amogh\bhoomitayi\android\app\build\outputs\bundle\release\app-release.aab"
$downloads = "C:\Users\amogh\Downloads"
$repoRoot = "C:\Users\amogh\bhoomitayi"

# Copy to repo root
Copy-Item $apkSource "$repoRoot\bhoomitayiv20.apk" -Force
Copy-Item $apkSource "$repoRoot\bhoomitayiv20-signed-release.apk" -Force
Copy-Item $apkSource "$repoRoot\BhoomiTayi.apk" -Force
Copy-Item $aabSource "$repoRoot\bhoomitayiv20playstore.aab" -Force

# Copy to Downloads directory
Copy-Item $apkSource "$downloads\bhoomitayiv20.apk" -Force
Copy-Item $apkSource "$downloads\bhoomitayiv20-signed-release.apk" -Force
Copy-Item $apkSource "$downloads\BhoomiTayi.apk" -Force
Copy-Item $aabSource "$downloads\bhoomitayiv20playstore.aab" -Force

Write-Host "=================== REPO ROOT FILES ==================="
Get-ChildItem "$repoRoot\bhoomitayiv20*.apk", "$repoRoot\bhoomitayiv20*.aab", "$repoRoot\BhoomiTayi.apk" | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | Format-Table -AutoSize

Write-Host "=================== DOWNLOADS FOLDER FILES ==================="
Get-ChildItem "$downloads\bhoomitayiv20*.apk", "$downloads\bhoomitayiv20*.aab", "$downloads\BhoomiTayi.apk" | Select-Object Name, @{Name="Size (MB)";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime | Format-Table -AutoSize
