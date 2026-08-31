Copy-Item "app\build\outputs\bundle\release\app-release.aab" "..\bhoomitayiv15playstore.aab" -Force
Copy-Item "app\build\outputs\bundle\release\app-release.aab" "C:\Users\amogh\Downloads\bhoomitayiv15playstore.aab" -Force
$f = Get-Item "C:\Users\amogh\Downloads\bhoomitayiv15playstore.aab"
$sizeMB = [math]::Round($f.Length / 1MB, 2)
Write-Host ("Name: " + $f.Name)
Write-Host ("Size: " + $sizeMB + " MB")
Write-Host ("Saved to: C:\Users\amogh\Downloads\" + $f.Name)
