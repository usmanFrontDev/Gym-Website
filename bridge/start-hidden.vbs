' Starts start-bridge.bat without leaving a console window open.
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
shell.Run "cmd /c """ & folder & "\start-bridge.bat""", 0, False
