# Script pour libérer le port 3001
Write-Host "🔍 Recherche du processus utilisant le port 3001..." -ForegroundColor Yellow

# Trouver le processus utilisant le port 3001
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "⚠️  Processus trouvé : PID $process" -ForegroundColor Yellow
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    if ($processInfo) {
        Write-Host "   Nom : $($processInfo.ProcessName)" -ForegroundColor Cyan
        Write-Host "   Chemin : $($processInfo.Path)" -ForegroundColor Cyan
    }
    
    Write-Host "`n🛑 Arrêt du processus..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Processus arrêté" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus n'utilise le port 3001" -ForegroundColor Cyan
}

Write-Host "`n✅ Vous pouvez maintenant lancer le serveur :" -ForegroundColor Green
Write-Host "   npm run dev:server" -ForegroundColor White
