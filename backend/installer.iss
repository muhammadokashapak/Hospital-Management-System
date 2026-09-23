[Setup]
AppName=Hospital ERP
AppVersion=1.0
DefaultDirName={autopf}\Hospital ERP
DefaultGroupName=Hospital ERP
UninstallDisplayIcon={app}\HospitalERP.exe
Compression=lzma2
SolidCompression=yes
OutputDir=Output
OutputBaseFilename=HospitalERP_Setup

[Files]
Source: "dist\HospitalERP.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Hospital ERP"; Filename: "{app}\HospitalERP.exe"
Name: "{commondesktop}\Hospital ERP"; Filename: "{app}\HospitalERP.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"

[Run]
Filename: "{app}\HospitalERP.exe"; Description: "Launch Hospital ERP"; Flags: nowait postinstall skipifsilent
