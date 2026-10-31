@echo off
REM ==========================================================================
REM  YDS Stüdyo Başlatıcı
REM  ES modülleri file:// protokolünde çalışmaz, bu yüzden yerel sunucu şart.
REM ==========================================================================
setlocal
cd /d "%~dp0"

set PORT=8768

echo.
echo   ========================================================
echo     YDS Stüdyo Başlatılıyor...
echo     Adres: http://localhost:%PORT%/studio.html
echo   ========================================================
echo.
echo   Kapatmak için bu pencerede Ctrl+C tuşlarına basın.
echo.

start "" "http://localhost:%PORT%/studio.html"

where python >nul 2>nul
if %errorlevel%==0 (
  python studio_server.py
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py studio_server.py
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo   UYARI: Python bulunamadı, node http-server kullanılıyor.
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo.
echo   HATA: Python veya Node bulunamadı.
echo.
pause
