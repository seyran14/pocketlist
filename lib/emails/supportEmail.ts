export function supportEmailHtml({
  fromEmail,
  message,
  pageUrl,
}: {
  fromEmail: string
  message: string
  pageUrl?: string
}): string {
  const safeMessage = message.replace(/\n/g, "<br />")
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New support request — PocketList</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0c0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0c0c0c;min-height:100vh;">
    <tr>
      <td align="center" style="padding:60px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:460px;width:100%;">

          <tr>
            <td style="padding-bottom:36px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">PocketList</span>
              <span style="display:inline-block;margin-left:8px;font-size:11px;font-weight:600;color:#0c0c0c;background-color:#ffffff;border-radius:6px;padding:3px 8px;letter-spacing:0.02em;">support</span>
            </td>
          </tr>

          <tr>
            <td style="background-color:#141414;border:1px solid #272727;border-radius:16px;padding:40px 36px;">
              <p style="margin:0 0 6px 0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">
                New support request
              </p>
              <p style="margin:0 0 28px 0;font-size:14px;color:#777777;line-height:1.6;">
                Someone reached out through the support form.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#0a0a0a;border:1px solid #252525;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px 0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;">From</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">${fromEmail}</p>
                    ${pageUrl ? `<p style="margin:10px 0 0 0;font-size:13px;color:#888;border-top:1px solid #252525;padding-top:10px;"><span style="color:#555;">Page</span> &nbsp;${pageUrl}</p>` : ""}
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#0a0a0a;border:1px solid #252525;border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 8px 0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                    <p style="margin:0;font-size:14px;color:#dddddd;line-height:1.7;">${safeMessage}</p>
                  </td>
                </tr>
              </table>

              <a href="mailto:${fromEmail}" style="display:block;text-align:center;background-color:#ffffff;color:#000000;text-decoration:none;font-weight:600;font-size:14px;padding:14px 20px;border-radius:10px;">
                Reply to ${fromEmail} →
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#3a3a3a;">PocketList &middot; Dubai Real Estate</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
