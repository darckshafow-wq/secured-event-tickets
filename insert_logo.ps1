$desktopFiles = Get-ChildItem -Path "c:\xampp\htdocs\secured-event-tickets\frontend\view\desktop" -Filter "*.html"
foreach ($file in $desktopFiles) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace '<div class="logo-icon">🎓</div>', '<img src="../../assets/logo.png" alt="Logo EPI" style="height: 45px;">'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

$mobileFiles = Get-ChildItem -Path "c:\xampp\htdocs\secured-event-tickets\frontend\view\mobile" -Filter "*.html"
foreach ($file in $mobileFiles) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace '<div class="app-logo">', '<img src="../../assets/logo.png" alt="Logo EPI" style="height: 60px; margin-bottom: 10px;">`n            <div class="app-logo">'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "Updated $($file.Name)"
    }
}

# index.html
$indexFile = "c:\xampp\htdocs\secured-event-tickets\index.html"
$content = Get-Content $indexFile -Raw
$newContent = $content -replace '<div class="logo">EduGest <span>Pro</span></div>', '<div class="logo" style="display: flex; align-items: center; gap: 10px;">`n            <img src="frontend/assets/logo.png" alt="Logo EPI" style="height: 40px;">`n            EduGest <span>Pro</span>`n        </div>'
if ($content -ne $newContent) {
    Set-Content -Path $indexFile -Value $newContent -NoNewline
    Write-Host "Updated index.html"
}
