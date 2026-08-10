Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param (
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = $size / 512.0

    # Background Gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 30, 98, 247),
        [System.Drawing.Color]::FromArgb(255, 244, 63, 94),
        55.0
    )

    # 3-Stop Gradient Blend (Electric Blue -> Vivid Purple -> Hot Pink)
    $colorBlend = New-Object System.Drawing.Drawing2D.ColorBlend
    $colorBlend.Colors = @(
        [System.Drawing.Color]::FromArgb(255, 30, 98, 247),
        [System.Drawing.Color]::FromArgb(255, 147, 51, 234),
        [System.Drawing.Color]::FromArgb(255, 244, 63, 94)
    )
    $colorBlend.Positions = @(0.0, 0.55, 1.0)
    $brush.InterpolationColors = $colorBlend

    # Squircle Path
    $r = [int](108 * $scale)
    $d = $r * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brush, $path)

    # Solid White Brush for P
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    # Stylized White P Path
    $pPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pPoints = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((250 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((315 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((385 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((420 * $scale), (165 * $scale))),
        (New-Object System.Drawing.PointF((420 * $scale), (225 * $scale))),
        (New-Object System.Drawing.PointF((420 * $scale), (285 * $scale))),
        (New-Object System.Drawing.PointF((385 * $scale), (322 * $scale))),
        (New-Object System.Drawing.PointF((315 * $scale), (322 * $scale))),
        (New-Object System.Drawing.PointF((270 * $scale), (322 * $scale))),
        (New-Object System.Drawing.PointF((220 * $scale), (330 * $scale))),
        (New-Object System.Drawing.PointF((182 * $scale), (395 * $scale))),
        (New-Object System.Drawing.PointF((172 * $scale), (412 * $scale))),
        (New-Object System.Drawing.PointF((158 * $scale), (418 * $scale))),
        (New-Object System.Drawing.PointF((150 * $scale), (412 * $scale))),
        (New-Object System.Drawing.PointF((144 * $scale), (400 * $scale))),
        (New-Object System.Drawing.PointF((150 * $scale), (382 * $scale))),
        (New-Object System.Drawing.PointF((170 * $scale), (345 * $scale))),
        (New-Object System.Drawing.PointF((182 * $scale), (320 * $scale))),
        (New-Object System.Drawing.PointF((220 * $scale), (290 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (260 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (245 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (220 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((220 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale))),
        (New-Object System.Drawing.PointF((185 * $scale), (128 * $scale)))
    )
    $pPath.AddBeziers($pPoints)
    $pPath.CloseFigure()

    $g.FillPath($whiteBrush, $pPath)

    # Hole inside P Loop (13 points = 3*4 + 1)
    $pHole = New-Object System.Drawing.Drawing2D.GraphicsPath
    $holePoints = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF((256 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((280 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((305 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((305 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((342 * $scale), (195 * $scale))),
        (New-Object System.Drawing.PointF((358 * $scale), (210 * $scale))),
        (New-Object System.Drawing.PointF((358 * $scale), (228 * $scale))),
        (New-Object System.Drawing.PointF((358 * $scale), (248 * $scale))),
        (New-Object System.Drawing.PointF((342 * $scale), (262 * $scale))),
        (New-Object System.Drawing.PointF((305 * $scale), (262 * $scale))),
        (New-Object System.Drawing.PointF((280 * $scale), (262 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (262 * $scale))),
        (New-Object System.Drawing.PointF((256 * $scale), (195 * $scale)))
    )
    $pHole.AddBeziers($holePoints)
    $pHole.CloseFigure()

    # Fill hole with background brush to cut out
    $g.FillPath($brush, $pHole)

    # Teal/Cyan Leaf Accent (10 points = 3*3 + 1)
    $leafBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.RectangleF((150 * $scale), (370 * $scale), (75 * $scale), (60 * $scale))),
        [System.Drawing.Color]::FromArgb(255, 0, 245, 184),
        [System.Drawing.Color]::FromArgb(255, 6, 182, 212),
        45.0
    )

    $leafPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $lPoints = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF((155 * $scale), (418 * $scale))),
        (New-Object System.Drawing.PointF((165 * $scale), (388 * $scale))),
        (New-Object System.Drawing.PointF((190 * $scale), (372 * $scale))),
        (New-Object System.Drawing.PointF((208 * $scale), (372 * $scale))),
        (New-Object System.Drawing.PointF((224 * $scale), (388 * $scale))),
        (New-Object System.Drawing.PointF((224 * $scale), (408 * $scale))),
        (New-Object System.Drawing.PointF((224 * $scale), (416 * $scale))),
        (New-Object System.Drawing.PointF((198 * $scale), (424 * $scale))),
        (New-Object System.Drawing.PointF((172 * $scale), (424 * $scale))),
        (New-Object System.Drawing.PointF((155 * $scale), (418 * $scale)))
    )
    $leafPath.AddBeziers($lPoints)
    $leafPath.CloseFigure()

    $g.FillPath($leafBrush, $leafPath)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Successfully generated $outputPath ($size x $size)"
}

Generate-Icon -size 512 -outputPath "public/icon-512.png"
Generate-Icon -size 192 -outputPath "public/icon-192.png"
Generate-Icon -size 180 -outputPath "public/apple-touch-icon.png"
Generate-Icon -size 64 -outputPath "public/favicon-64.png"
Generate-Icon -size 32 -outputPath "public/favicon-32.png"
Generate-Icon -size 512 -outputPath "public/logo.png"
