@echo off
echo Step 1: Closing MMS-Node application...
taskkill /F /IM "MMS-Node.exe" >nul
echo Step 1: Waiting for 1 seconds...
timeout /t 1 /nobreak >nul
echo Step 2: Copying contents from newsoftware2 to newsoftware...
xcopy /Y /E /I "C:\Users\tagbi\Desktop\TAGBIN_CODE\mms_node\newsoftware2\win-unpacked" "C:\Users\tagbi\Desktop\TAGBIN_CODE\mms_node\"
echo Step 3: Starting the application...
start "" /B "C:\Users\tagbi\Desktop\TAGBIN_CODE\mms_node\MMS-Node.exe"
