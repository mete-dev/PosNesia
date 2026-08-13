param(
    [string]$Token = '',  # Masukkan token GitHub melalui parameter saat menjalankan script
    [string]$Repo = 'mete-dev/PosNesia',
    [string]$Tag = 'v1.0.0',
    [string]$ExePath = 'aplikasi\PosNesia-Setup-1.0.0.exe',
    [string]$ApkPath = 'aplikasi\PosNesia.apk'
)

# Build request body for the release
$body = @{
    tag_name   = $Tag
    name       = "PosNesia $Tag"
    body       = "Release of PosNesia version $Tag"
    draft      = $false
    prerelease = $false
}

# Create the release via GitHub API
$release = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$Repo/releases" 
    -Headers @{ Authorization = "token $Token"; Accept = 'application/vnd.github+json' } 
    -Body (ConvertTo-Json $body -Depth 5)

$uploadUrl = $release.upload_url -replace '\{.*\}'
Write-Host "Release created – upload URL: $uploadUrl"

# Upload Windows installer (.exe)
if (Test-Path $ExePath) {
    Write-Host "Uploading EXE: $ExePath"
    Invoke-RestMethod -Method Post -Uri "$uploadUrl?name=$(Split-Path -Leaf $ExePath)" 
        -Headers @{ Authorization = "token $Token"; 'Content-Type' = 'application/octet-stream' } 
        -InFile $ExePath
    Write-Host "EXE uploaded successfully."
} else {
    Write-Host "EXE not found at $ExePath"
}

# Upload Android package (.apk)
if (Test-Path $ApkPath) {
    Write-Host "Uploading APK: $ApkPath"
    Invoke-RestMethod -Method Post -Uri "$uploadUrl?name=$(Split-Path -Leaf $ApkPath)" 
        -Headers @{ Authorization = "token $Token"; 'Content-Type' = 'application/octet-stream' } 
        -InFile $ApkPath
    Write-Host "APK uploaded successfully."
} else {
    Write-Host "APK not found at $ApkPath"
}
