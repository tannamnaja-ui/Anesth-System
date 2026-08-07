; Anesth System - full offline installer
; Bundles a self-contained server exe (Node runtime embedded via pkg), the
; built frontend, and NSSM (to run the server as a hidden Windows service
; with no console window and no internet access required at install time).

#define MyAppName "Anesth System"
#define MyAppVersion "1.0.0"
#define MyServiceName "AnesthSystem"
#define MyAppExeName "AnesthServer.exe"

[Setup]
AppId={{8F2C7B2B-6C6E-4E9A-9B0B-2C5B7E6B1A11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\AnesthSystem
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=Anesth-System-Setup-Full
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=payload\icon.ico
UninstallDisplayIcon={app}\icon.ico
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableWelcomePage=no
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "payload\AnesthServer.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "payload\nssm.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "payload\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "payload\frontend-dist\*"; DestDir: "{app}\frontend-dist"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "http://localhost:8020"; IconFilename: "{app}\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "http://localhost:8020"; IconFilename: "{app}\icon.ico"

[Run]
Filename: "{app}\nssm.exe"; Parameters: "install {#MyServiceName} ""{app}\{#MyAppExeName}"""; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set {#MyServiceName} AppDirectory ""{app}"""; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set {#MyServiceName} Start SERVICE_AUTO_START"; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set {#MyServiceName} AppStdout ""{app}\service.log"""; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "set {#MyServiceName} AppStderr ""{app}\service.log"""; Flags: runhidden waituntilterminated
Filename: "{app}\nssm.exe"; Parameters: "start {#MyServiceName}"; Flags: runhidden waituntilterminated
Filename: "http://localhost:8020"; Description: "เปิด Anesth System"; Flags: postinstall shellexec skipifsilent

[UninstallRun]
Filename: "{app}\nssm.exe"; Parameters: "stop {#MyServiceName}"; Flags: runhidden waituntilterminated; RunOnceId: "StopAnesthService"
Filename: "{app}\nssm.exe"; Parameters: "remove {#MyServiceName} confirm"; Flags: runhidden waituntilterminated; RunOnceId: "RemoveAnesthService"

[Code]
// Silently removes a previous install (any version) before this one
// proceeds, per "auto-remove old setup before installing the new one".
function InitializeSetup(): Boolean;
var
  UninstallString: String;
  ResultCode: Integer;
begin
  Result := True;
  if RegQueryStringValue(HKLM, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1',
       'UninstallString', UninstallString) then
  begin
    UninstallString := RemoveQuotes(UninstallString);
    if FileExists(UninstallString) then
    begin
      Exec(UninstallString, '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART', '', SW_HIDE,
        ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

// Safety net: stop/remove any lingering service before copying files, in
// case a previous install left the service running outside of this
// installer's own uninstall flow (e.g. files were deleted by hand).
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  NssmPath: String;
begin
  Result := '';
  NssmPath := ExpandConstant('{app}\nssm.exe');
  if FileExists(NssmPath) then
  begin
    Exec(NssmPath, 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(NssmPath, 'remove {#MyServiceName} confirm', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
