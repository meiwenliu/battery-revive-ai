@echo off
chcp 65001 >nul
title 打开 焕芯·电愈智策 网页
echo 正在打开《焕芯·电愈智策》决策系统页面...
start "" "%~dp0frontend\index.html"
exit
