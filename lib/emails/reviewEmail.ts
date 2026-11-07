import { escapeHtml } from "./escape"

export function reviewEmailHtml({
  listingName,
  listingUrl,
  approved,
  note,
}: {
  listingName: string
  listingUrl: string
  approved: boolean
  note?: string
}) {
  const heading = approved ? "Your listing is live" : "Your listing needs changes"
  const body = approved
    ? `We checked your documents and published ${escapeHtml(listingName)}.`
    : `We couldn't publish ${escapeHtml(listingName)} yet.${note ? `<br /><br />${escapeHtml(note)}` : ""}`
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:32px 16px;background-color:#0c0c0c;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;margin:0 0 12px;">${heading}</h1>
    <p style="font-size:14px;line-height:1.6;color:#c8c8c8;margin:0 0 20px;">${body}</p>
    <a href="${listingUrl}" style="color:#f5f5f5;font-size:14px;">${approved ? "View your listing" : "Update your listing"}</a>
  </div>
</body>
</html>`
}
