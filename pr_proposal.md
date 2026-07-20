# 🔒 Fix XSS vulnerability in data URI parsing

## 🎯 What
The `sanitizeImageUrl` function improperly validated data URIs by only checking if the pathname started with `image/`. This allowed `image/svg+xml` data URIs with embedded executable scripts to pass the validation.

## ⚠️ Risk
If left unfixed, an attacker could supply an SVG file containing a malicious JavaScript payload as an image URI (e.g., in a sauna visit's image field), causing an XSS attack when the application renders the image or if the user clicks/views it directly.

## 🛡️ Solution
Updated the data URI validation to use a regular expression that strictly whitelists safe image MIME types (`jpeg`, `jpg`, `png`, `gif`, `webp`, `bmp`) and ensures the correct syntax before base64 data. Dangerous payloads like SVG or HTML are thus rejected and XSS is prevented.
