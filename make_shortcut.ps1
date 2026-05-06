$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Suzuki School.lnk")
$Shortcut.TargetPath = "C:\Users\Vladimir\.gemini\antigravity\scratch\suzuki-cello-school-app\start_app.cmd"
$Shortcut.WorkingDirectory = "C:\Users\Vladimir\.gemini\antigravity\scratch\suzuki-cello-school-app"
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Start Suzuki School App"
$Shortcut.Save()
