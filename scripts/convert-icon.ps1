# Convert SVG to PNG using PowerShell with WPF

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms

$svgPath = "icon.svg"
$pngPath = "icon.png"
$width = 128
$height = 128

try {
    # Load the SVG using WebBrowser or create a simple bitmap
    # Since System.Drawing doesn't support SVG, we'll create a simple icon programmatically
    
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Draw blue circle background
    $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))
    $graphics.FillEllipse($blueBrush, 0, 0, $width, $height)
    
    # Draw white shield
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $shieldPoints = @(
        [System.Drawing.Point]::new(64, 20),
        [System.Drawing.Point]::new(92, 32),
        [System.Drawing.Point]::new(92, 60),
        [System.Drawing.Point]::new(64, 100),
        [System.Drawing.Point]::new(36, 60),
        [System.Drawing.Point]::new(36, 32)
    )
    $graphics.FillPolygon($whiteBrush, $shieldPoints)
    
    # Draw green checkmark
    $greenPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(34, 197, 94), 5)
    $graphics.DrawLine($greenPen, 48, 60, 60, 72)
    $graphics.DrawLine($greenPen, 60, 72, 80, 48)
    
    # Save as PNG
    $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bmp.Dispose()
    $whiteBrush.Dispose()
    $blueBrush.Dispose()
    $greenPen.Dispose()
    
    Write-Host "Icon generated successfully: $pngPath"
}
catch {
    Write-Error "Failed to generate icon: $_"
    exit 1
}
