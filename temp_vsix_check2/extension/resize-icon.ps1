Add-Type -AssemblyName System.Drawing
 = " d:\SWEObeyMe-restored\icon.png\
\ = [System.Drawing.Image]::FromFile(\)
Write-Host \Current size: \x\\
\ = New-Object System.Drawing.Bitmap(128, 128)
\ = [System.Drawing.Graphics]::FromImage(\)
\.DrawImage(\, 0, 0, 128, 128)
\.Dispose()
\.Dispose()
\.Save(\, [System.Drawing.Imaging.ImageFormat]::Png)
\.Dispose()
Write-Host \Icon resized to 128x128\
