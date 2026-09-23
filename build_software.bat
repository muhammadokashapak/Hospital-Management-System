@echo off
echo ===========================================
echo   Hospital ERP - Automated Build Script
echo ===========================================
echo.

echo [Step 1/3] Building the React Frontend...
cd frontend
call npm install
call npm run build
cd ..
echo Frontend build completed!
echo.

echo [Step 2/3] Packaging the Backend and Frontend into .exe (PyInstaller)...
cd backend
call .\venv\Scripts\pyinstaller.exe desktop_app.spec
echo PyInstaller packaging completed!
echo.

echo [Step 3/3] Compiling Setup Wizard (Inno Setup)...
"C:\Users\Muhammad Talha\AppData\Local\Programs\Inno Setup 6\iscc.exe" installer.iss
echo Setup Wizard compilation completed!
cd ..
echo.

echo ===========================================
echo   Build Successful! 
echo   Your setup file is located at:
echo   backend\Output\HospitalERP_Setup.exe
echo ===========================================
