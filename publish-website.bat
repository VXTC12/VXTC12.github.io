@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo.
echo ========================================
echo   我们的小世界 - 发布到线上
echo ========================================
echo.
echo [1/3] 正在检查网站能否正常构建...
call npm.cmd run build
if errorlevel 1 goto error

echo.
echo [2/3] 正在整理本次修改...
git add -A
if errorlevel 1 goto error

git diff --cached --quiet
if not errorlevel 1 goto push_changes

git commit -m "更新网站内容"
if errorlevel 1 goto error

:push_changes
echo.
echo [3/3] 正在上传到 GitHub...
git push origin main
if errorlevel 1 goto error

echo.
echo 发布成功！GitHub 通常会在 1 到 3 分钟内更新线上网站。
echo 即将打开自动部署进度页面；看到绿色对勾后即可刷新网站。
start "" "https://github.com/VXTC12/VXTC12.github.io/actions"
echo.
pause
exit /b 0

:error
echo.
echo 发布没有完成。请不要反复操作，把这个窗口里的报错截图发给我。
echo.
pause
exit /b 1
