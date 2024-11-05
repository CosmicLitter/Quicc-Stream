@echo off

:: Check if node_modules directory exists (indicates npm i has been run)
if not exist "node_modules" (
    echo Installing dependencies...
    call npm i
    if %errorlevel% neq 0 (
        echo Failed to install dependencies.
        pause
        exit /b %errorlevel%
    )
) else (
    echo Dependencies already installed.
)

:: Check if the build output exists (adjust this to your actual build folder/file)
REM if not exist "build" (
REM     echo Running build...
REM     call npm run build
REM     if %errorlevel% neq 0 (
REM         echo Build failed.
REM         pause
REM         exit /b %errorlevel%
REM     )
REM ) else (
REM     echo Build already exists.
REM )

:: Run the server
echo Starting the server...
call npm run dev 

:: Keep the terminal open
pause
