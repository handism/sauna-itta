# 🧪 Test error handling in sanitizeImageUrl

## Description
* 🎯 **What:** The testing gap addressed was the lack of coverage for the `sanitizeImageUrl` function, specifically missing tests for valid inputs, unsupported protocols, and the `catch` block for malformed URLs that throw during parsing.
* 📊 **Coverage:** The tests now cover valid `http`/`https` URLs, valid `data:image` URLs, falsy inputs, unsupported protocols (`ftp`, `javascript`, `data:text`), and malformed URLs (`http://[1:2:3:4:5:6:7:8:9]/`) that trigger the `catch` block.
* ✨ **Result:** The improvement in test coverage ensures the reliability of URL sanitization and properly verifies the error handling when URL parsing fails.
