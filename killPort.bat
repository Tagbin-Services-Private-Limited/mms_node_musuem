@echo off

if "%1"=="" (
    echo No port number provided. Exiting.
    exit /b 1
)

set port=%1

echo Searching for processes using port %port%...

for /f "tokens=5" %%a in ('netstat -aon ^| find "LISTENING" ^| find ":%port%"') do (
    echo Terminating process with PID %%a
    taskkill /f /pid %%a
)

echo Process termination complete.
