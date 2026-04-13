import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return page('Invalid Link', 'This acknowledgment link is missing a token.', false)
  }

  try {
    const ticket = await prisma.helpdeskTicket.findUnique({ where: { token } })

    if (!ticket) {
      return page('Link Not Found', 'This acknowledgment link is invalid or has expired.', false)
    }

    if (!ticket.acknowledgedAt) {
      await prisma.helpdeskTicket.update({
        where: { token },
        data: { acknowledgedAt: new Date() },
      })
    }

    return page(
      'Ticket Acknowledged',
      `You have acknowledged the help desk request from <strong>${esc(ticket.name)}</strong> regarding "<em>${esc(ticket.subject)}</em>".<br><br>Reply directly to <a href="mailto:${esc(ticket.email)}">${esc(ticket.email)}</a> to follow up with the requester.`,
      true
    )
  } catch (err) {
    console.error('[GET /api/helpdesk/acknowledge]', err)
    return page('Error', 'Something went wrong. Please try again.', false)
  }
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function page(title, body, success) {
  const icon  = success ? '✅' : '❌'
  const color = success ? '#166534' : '#dc2626'
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — D.A.V.I.D. Help Desk</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{max-width:480px;width:100%;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:40px 36px;text-align:center}
    .icon{font-size:52px;margin-bottom:16px}
    h1{font-size:22px;color:${color};margin-bottom:12px}
    p{font-size:15px;color:#374151;line-height:1.6}
    a{color:#7f1d1d}
    .foot{margin-top:28px;font-size:12px;color:#9ca3af}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <p class="foot">D.A.V.I.D. — Urban Affairs Coalition</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
