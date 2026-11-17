Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Get-Location).Path
$source = Join-Path $root 'Widget_Factory_Template.pptx'
$output = Join-Path $root 'Pact_Pitch_Deck.pptx'
if (-not (Test-Path -LiteralPath $source)) { throw "Template not found in $root" }
Copy-Item -LiteralPath $source -Destination $output -Force

$json = @"
{
  "1": [
    [["Pact"]],
    [["pact-bch.vercel.app"]],
    [["GitHub: Pact"]],
    [["BCH BLAZE 2026"]],
    [["Source: github.com/dr4ken-soul/Pact"]]
  ],
  "2": [
    [
      ["Pact", "!", ""],
      ["User-defined rules. Human wallet approval."],
      ["pact-bch.vercel.app"]
    ]
  ],
  "3": [
    [["The Payment Gap"]],
    [["pact-bch.vercel.app"]],
    [
      ["Agents can request payments, but wallet approval alone does not encode a recipient, per-payment cap, or expiry."],
      ["Pact makes the rules and full transaction visible, then asks a user-controlled BCH wallet to sign."]
    ],
    [["Why Pact Exists"]]
  ],
  "4": [
    [["The Pact Flow"]],
    [
      ["Set an approved BCH recipient"],
      ["Choose a per-payment cap"],
      ["Set the rule expiry"],
      ["Pact checks the policy in the app"],
      ["Review and sign in your wallet"],
      ["Demo payments use Chipnet"]
    ]
  ],
  "5": [
    [
      ["BCH", " payment flow"],
      ["Cap, recipient and expiry are checked in the app before a payment is prepared."],
      ["A compatible BCH wallet reviews and signs. Pact broadcasts the transaction and records its ID."]
    ]
  ],
  "6": [
    [["What Remains"]],
    [
      ["EMBER2026 address supplied; token identity still needs team verification."],
      ["Add a separate Chipnet receive address and approved demo amount."],
      ["Current XO support validates a generic P2PKH schema, not a Pact covenant."],
      ["Build on-chain recipient, cap, expiry and repeated-spend constraints."],
      ["Execute and inspect a Chipnet invitation before claiming XO complete."]
    ]
  ],
  "7": [
    [["THANK YOU!"]]
  ]
}
"@
$replacements = ConvertFrom-Json $json

$zip = [System.IO.Compression.ZipFile]::Open($output, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  for ($number = 1; $number -le 7; $number++) {
    $entryName = "ppt/slides/slide$number.xml"
    $entry = $zip.GetEntry($entryName)
    if ($null -eq $entry) { throw "Missing $entryName" }
    $memory = [System.IO.MemoryStream]::new()
    $readStream = $entry.Open()
    try { $readStream.CopyTo($memory) } finally { $readStream.Dispose() }
    $memory.Position = 0
    $document = [System.Xml.XmlDocument]::new()
    $document.PreserveWhitespace = $true
    $document.Load($memory)
    $memory.Dispose()

    $textShapes = [System.Collections.Generic.List[object]]::new()
    foreach ($shape in $document.SelectNodes("//*[local-name()='sp']")) {
      $paragraphs = [System.Collections.Generic.List[object]]::new()
      foreach ($paragraph in $shape.SelectNodes(".//*[local-name()='p']")) {
        $hasVisibleText = $false
        foreach ($textNode in $paragraph.SelectNodes(".//*[local-name()='t']")) {
          if (-not [string]::IsNullOrEmpty($textNode.InnerText)) { $hasVisibleText = $true }
        }
        if ($hasVisibleText) { $paragraphs.Add($paragraph) }
      }
      if ($paragraphs.Count -gt 0) {
        $textShapes.Add([pscustomobject]@{ Paragraphs = $paragraphs })
      }
    }

    $slideSpec = $replacements.PSObject.Properties.Item([string]$number).Value
    if ($textShapes.Count -ne $slideSpec.Count) {
      throw "$entryName has $($textShapes.Count) text shapes, expected $($slideSpec.Count)"
    }
    for ($shapeIndex = 0; $shapeIndex -lt $textShapes.Count; $shapeIndex++) {
      $shapeSpec = $slideSpec[$shapeIndex]
      $paragraphList = $textShapes[$shapeIndex].Paragraphs
      if ($paragraphList.Count -ne $shapeSpec.Count) {
        throw "$entryName shape $shapeIndex has $($paragraphList.Count) text paragraphs, expected $($shapeSpec.Count)"
      }
      for ($paragraphIndex = 0; $paragraphIndex -lt $paragraphList.Count; $paragraphIndex++) {
        $paragraph = $paragraphList[$paragraphIndex]
        $textNodes = @($paragraph.SelectNodes(".//*[local-name()='t']"))
        $runValues = @($shapeSpec[$paragraphIndex])
        if ($textNodes.Count -eq 0 -or $runValues.Count -eq 0) {
          throw "Empty text mapping at $entryName shape $shapeIndex paragraph $paragraphIndex"
        }
        for ($runIndex = 0; $runIndex -lt $textNodes.Count; $runIndex++) {
          if ($runIndex -lt $runValues.Count) {
            $textNodes[$runIndex].InnerText = [string]$runValues[$runIndex]
          } else {
            $textNodes[$runIndex].InnerText = ''
          }
        }
      }
    }

    $entry.Delete()
    $newEntry = $zip.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $writeStream = $newEntry.Open()
    $settings = [System.Xml.XmlWriterSettings]::new()
    $settings.Encoding = [System.Text.UTF8Encoding]::new($false)
    $settings.Indent = $false
    $settings.OmitXmlDeclaration = $false
    $writer = [System.Xml.XmlWriter]::Create($writeStream, $settings)
    try { $document.Save($writer) } finally { $writer.Dispose(); $writeStream.Dispose() }
  }
} finally {
  $zip.Dispose()
}
Write-Output "Created $output"




