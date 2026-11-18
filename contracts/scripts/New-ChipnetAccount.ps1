param(
    [ValidateSet('create-profile.mjs', 'create-invitation.mjs')]
    [string]$Script = 'create-profile.mjs'
)

$ErrorActionPreference = 'Stop'
$contractsDir = Split-Path -Parent $PSScriptRoot
$stateDir = Join-Path $contractsDir '.xo-state'
$protectedPath = Join-Path $stateDir 'chipnet-mnemonic.dpapi'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$tempDir = Join-Path $stateDir 'temp'
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
$env:TEMP = $tempDir
$env:TMP = $tempDir

if (-not ('PactDpapi' -as [type])) {
    Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class PactDpapi {
    [StructLayout(LayoutKind.Sequential)] private struct DataBlob { public int cbData; public IntPtr pbData; }
    [DllImport("crypt32.dll", SetLastError=true, CharSet=CharSet.Unicode)] private static extern bool CryptProtectData(ref DataBlob input, string description, IntPtr entropy, IntPtr reserved, IntPtr prompt, uint flags, out DataBlob output);
    [DllImport("crypt32.dll", SetLastError=true, CharSet=CharSet.Unicode)] private static extern bool CryptUnprotectData(ref DataBlob input, out IntPtr description, IntPtr entropy, IntPtr reserved, IntPtr prompt, uint flags, out DataBlob output);
    [DllImport("kernel32.dll", SetLastError=true)] private static extern IntPtr LocalFree(IntPtr memory);
    private static DataBlob MakeBlob(byte[] value) { var p=Marshal.AllocHGlobal(value.Length); Marshal.Copy(value,0,p,value.Length); return new DataBlob { cbData=value.Length, pbData=p }; }
    private static byte[] CopyBlob(DataBlob value) { var bytes=new byte[value.cbData]; Marshal.Copy(value.pbData,bytes,0,value.cbData); return bytes; }
    public static byte[] Protect(byte[] clear) { var input=MakeBlob(clear); DataBlob output=new DataBlob(); try { if(!CryptProtectData(ref input,"Pact Chipnet XO account",IntPtr.Zero,IntPtr.Zero,IntPtr.Zero,0,out output)) throw new Win32Exception(Marshal.GetLastWin32Error()); return CopyBlob(output); } finally { if(input.pbData!=IntPtr.Zero) Marshal.FreeHGlobal(input.pbData); if(output.pbData!=IntPtr.Zero) LocalFree(output.pbData); } }
    public static byte[] Unprotect(byte[] protectedData) { var input=MakeBlob(protectedData); DataBlob output=new DataBlob(); IntPtr description=IntPtr.Zero; try { if(!CryptUnprotectData(ref input,out description,IntPtr.Zero,IntPtr.Zero,IntPtr.Zero,1,out output)) throw new Win32Exception(Marshal.GetLastWin32Error()); return CopyBlob(output); } finally { if(input.pbData!=IntPtr.Zero) Marshal.FreeHGlobal(input.pbData); if(description!=IntPtr.Zero) LocalFree(description); if(output.pbData!=IntPtr.Zero) LocalFree(output.pbData); } }
}
"@
}

if (-not (Test-Path -LiteralPath $protectedPath)) {
    Push-Location $contractsDir
    try {
        $mnemonic = & node --input-type=module -e "import { generateBip39Mnemonic } from '@bitauth/libauth'; process.stdout.write(generateBip39Mnemonic())"
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($mnemonic)) { throw 'Could not create a local Chipnet test account.' }
        $bytes = [Text.Encoding]::UTF8.GetBytes($mnemonic)
        $cipher = [PactDpapi]::Protect($bytes)
        [Convert]::ToBase64String($cipher) | Set-Content -LiteralPath $protectedPath -Encoding ascii
        [Array]::Clear($bytes, 0, $bytes.Length)
        [Array]::Clear($cipher, 0, $cipher.Length)
        $mnemonic = $null
    }
    finally { Pop-Location }
}

$cipher = [Convert]::FromBase64String((Get-Content -LiteralPath $protectedPath -Raw).Trim())
$clear = [PactDpapi]::Unprotect($cipher)
$reprotected = [PactDpapi]::Protect($clear)
[Convert]::ToBase64String($reprotected) | Set-Content -LiteralPath $protectedPath -Encoding ascii
[Array]::Clear($reprotected, 0, $reprotected.Length)
$plainPhrase = [Text.Encoding]::UTF8.GetString($clear)
[Array]::Clear($clear, 0, $clear.Length)
[Array]::Clear($cipher, 0, $cipher.Length)
Push-Location $contractsDir
try {
    $plainPhrase | & node ('scripts/' + $Script)
    if ($LASTEXITCODE -ne 0) { throw 'XO Chipnet account setup failed. See the error above.' }
}
finally {
    Pop-Location
    $plainPhrase = $null
}
