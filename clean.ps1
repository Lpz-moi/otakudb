# Script de nettoyage pour OtakuDB
Write-Host "🧹 Nettoyage du cache Vite..." -ForegroundColor Yellow

# Supprimer le cache Vite
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Cache Vite supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Cache Vite déjà supprimé" -ForegroundColor Cyan
}

# Supprimer les source maps corrompus de lucide-react
$fanMapPath = "node_modules\lucide-react\dist\esm\icons\fan.js.map"
if (Test-Path $fanMapPath) {
    Remove-Item $fanMapPath -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Source map corrompue supprimée" -ForegroundColor Green
}

Write-Host "`n✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host "`nVous pouvez maintenant relancer :" -ForegroundColor Cyan
Write-Host "  npm run dev:server  (Terminal 1)" -ForegroundColor White
Write-Host "  npm run dev         (Terminal 2)" -ForegroundColor White
