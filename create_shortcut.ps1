$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "Suzuki Cello School.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\Vladimir\.gemini\antigravity\scratch\suzuki-cello-school-app\launch.bat"
$Shortcut.WorkingDirectory = "C:\Users\Vladimir\.gemini\antigravity\scratch\suzuki-cello-school-app"
$Shortcut.IconLocation = "C:\Users\Vladimir\.gemini\antigravity\scratch\suzuki-cello-school-app\suzuki_cello.ico"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
Write-Host "Shortcut created at $ShortcutPath"
