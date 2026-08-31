Copy-Item "app\build\outputs\bundle\release\app-release.aab" "..\bhoomitayiv18playstore.aab" -Force
Copy-Item "app\build\outputs\bundle\release\app-release.aab" "C:\Users\amogh\Downloads\bhoomitayiv18playstore.aab" -Force
$f = Get-Item "C:\Users\amogh\Downloads\bhoomitayiv18playstore.aab"
$sizeMB = [math]::Round($f.Length / 1MB, 2)
Write-Host ("Name: " + $f.Name)
Write-Host ("Size: " + $sizeMB + " MB")
Write-Host ("Downloads Path: C:\Users\amogh\Downloads\" + $f.Name)
Write-Host ("Repo Path: C:\Users\amogh\bhoomitayi\" + $f.Name)
