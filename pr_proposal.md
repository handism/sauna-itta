# Title: 🔒 [Security] Replace dangerouslySetInnerHTML with Next.js Script in layout

## Description
🎯 **What:** The vulnerability fixed is the use of `dangerouslySetInnerHTML` for injecting the initial theme script in `src/app/layout.tsx`. It has been replaced with Next.js's `<Script>` component using `strategy="beforeInteractive"`.

⚠️ **Risk:** While the current implementation used a constant string without dynamic injection (meaning actual exploitability was zero), using `dangerouslySetInnerHTML` is generally considered an insecure pattern. If future changes inadvertently introduced user-controlled data into `THEME_INIT_SCRIPT`, it could have led to a Cross-Site Scripting (XSS) vulnerability.

🛡️ **Solution:** By replacing `dangerouslySetInnerHTML` with `next/script` (`<Script id="theme-init" strategy="beforeInteractive">{THEME_INIT_SCRIPT}</Script>`), we eliminate the insecure pattern. The `beforeInteractive` strategy ensures the script is still injected and executed early (in the `<head>`), preserving the prevention of a dark-to-light theme flicker before initial rendering. This improves the security posture and hygiene of the codebase without altering functionality.
