$source = "C:\Users\danie\.gemini\antigravity\scratch\smart-dentist"
$destination = "C:\Users\danie\.gemini\antigravity\scratch\SmartDentist_Backup_v1.zip"
$exclude = @("node_modules", ".git", "dist", "dental.db-journal")

# Create a temporary folder
$tempDir = Join-Path $env:TEMP "SmartDentist_Backup_Temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Copy files excluding node_modules
Get-ChildItem -Path $source -Recurse | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) {
        if ($path -match "\\$ex") { $skip = $true; break }
    }
    return -not $skip
} | ForEach-Object {
    $relativePath = $_.FullName.Substring($source.Length)
    $destPath = Join-Path $tempDir $relativePath
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Force -Path $destPath | Out-Null
    } else {
        Copy-Item -Path $_.FullName -Destination $destPath -Force
    }
}

# Zip the temp folder
Compress-Archive -Path "$tempDir\*" -DestinationPath $destination -Force

# Clean up
Remove-Item $tempDir -Recurse -Force

Write-Host "Backup created at: $destination"
