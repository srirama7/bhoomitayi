Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\bhoomitayiv18.apk" -Force
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "C:\Users\amogh\Downloads\bhoomitayiv18.apk" -Force
$f = Get-Item "C:\Users\amogh\Downloads\bhoomitayiv18.apk"
$sizeMB = [math]::Round($f.Length / 1MB, 2)
Write-Host ("Name: " + $f.Name)
Write-Host ("Size: " + $sizeMB + " MB")
Write-Host ("Path: C:\Users\amogh\Downloads\" + $f.Name)
