import { escapeHtml } from "./escape"

export function contractEmailHtml({
  heading,
  body,
  url,
  action,
}: {
  heading: string
  body: string
  url?: string
  action?: string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:32px 16px;background-color:#0c0c0c;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;margin:0 0 12px;">${escapeHtml(heading)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#c8c8c8;margin:0 0 20px;">${escapeHtml(body)}</p>
    ${url && action ? `<a href="${url}" style="color:#f5f5f5;font-size:14px;">${escapeHtml(action)}</a>` : ""}
  </div>
</body>
</html>`
}
