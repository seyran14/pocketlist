export function signInEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to PocketList</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0c0c0c;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:460px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:36px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">PocketList</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#141414;border:1px solid #272727;border-radius:16px;padding:40px 36px;">

              <p style="margin:0 0 6px 0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">
                Your sign-in code
              </p>
              <p style="margin:0 0 32px 0;font-size:14px;color:#777777;line-height:1.6;">
                Enter this code to sign in. It expires in 15&nbsp;minutes.
              </p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="background-color:#0a0a0a;border:1px solid #303030;border-radius:12px;padding:28px 20px;">
                    <span style="font-size:48px;font-weight:700;color:#ffffff;letter-spacing:14px;font-variant-numeric:tabular-nums;font-family:'Courier New',Courier,monospace;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#4a4a4a;line-height:1.6;">
                If you didn&apos;t request this code, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#3a3a3a;">
                PocketList &middot; Dubai Real Estate
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
