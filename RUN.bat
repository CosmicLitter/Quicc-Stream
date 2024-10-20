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
if not exist "build" (
    echo Running build...
    call npm run build
    if %errorlevel% neq 0 (
        echo Build failed.
        pause
        exit /b %errorlevel%
    )
) else (
    echo Build already exists.
)

:: Run the server
echo Starting the server...
call npm run preview

:: Keep the terminal open
pause
