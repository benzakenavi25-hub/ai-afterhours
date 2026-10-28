$ErrorActionPreference = "Stop"
$port = 8765
$url = "http://127.0.0.1:$port/"
$root = $PSScriptRoot

function Test-Server {
  try {
    $r = Invoke-WebRequest -Uri "${url}index.html" -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (-not (Test-Server)) {
  $job = Start-Job -ScriptBlock {
    param($Root, $Port)
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    $listener.Start()
    $types = @{
      ".html" = "text/html; charset=utf-8"
      ".css"  = "text/css; charset=utf-8"
      ".js"   = "application/javascript; charset=utf-8"
      ".svg"  = "image/svg+xml"
    }
    while ($listener.IsListening) {
      $ctx = $listener.GetContext()
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.LocalPath)
      if ($rel -eq "/") { $rel = "/index.html" }
      $file = Join-Path $Root ($rel.TrimStart("/") -replace "/", "\")
      if (Test-Path -LiteralPath $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $ctx.Response.ContentType = $(if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" })
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $ctx.Response.StatusCode = 404
        $msg = [Text.Encoding]::UTF8.GetBytes("not found")
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      }
      $ctx.Response.Close()
    }
  } -ArgumentList $root, $port

  Start-Sleep -Seconds 1
  if (-not (Test-Server)) {
    Write-Host "לא הצלחתי להעלות שרת מקומי על פורט $port"
    exit 1
  }
  Write-Host "שרת מקומי על $url (Job $($job.Id))"
} else {
  Write-Host "שרת כבר רץ: $url"
}

Start-Process "${url}index.html"
Write-Host "נפתח בדפדפן: ${url}index.html"
