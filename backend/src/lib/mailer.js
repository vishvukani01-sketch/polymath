import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendWeeklyDigest = async ({ to, name, stats, domains }) => {
  const domainList = domains.map(d => `<li>${d.emoji} ${d.name}</li>`).join('')
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Nunito', sans-serif; background: #0A0A0F; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 0 auto; padding: 32px 24px; }
        .logo { font-size: 32px; font-weight: 900; color: #FF6B35; margin-bottom: 8px; }
        .card { background: #252535; border-radius: 20px; padding: 24px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.05); }
        .stat { display: flex; justify-content: space-between; margin: 8px 0; }
        .stat-label { color: rgba(255,255,255,0.5); }
        .stat-value { font-weight: 800; color: #FFD700; }
        .btn { display: block; background: #FF6B35; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 16px; text-align: center; font-weight: 800; margin: 24px 0; }
        .footer { text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🧪 Polymath</div>
        <h1 style="color: #fff; font-size: 24px;">Your Weekly Digest, ${name}! 🎓</h1>
        <p style="color: rgba(255,255,255,0.6);">Here's what you accomplished this week:</p>
        <div class="card">
          <div class="stat"><span class="stat-label">⚡ XP Earned</span><span class="stat-value">+${stats.weeklyXP}</span></div>
          <div class="stat"><span class="stat-label">🔥 Current Streak</span><span class="stat-value">${stats.streak} days</span></div>
          <div class="stat"><span class="stat-label">📚 Cards Completed</span><span class="stat-value">${stats.cardsCompleted}</span></div>
          <div class="stat"><span class="stat-label">🏆 Current Level</span><span class="stat-value">Level ${stats.level}</span></div>
        </div>
        <div class="card">
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 12px;">Domains you're studying:</p>
          <ul style="color: #fff; padding-left: 20px;">${domainList}</ul>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Continue Learning 🚀</a>
        <div class="footer">
          <p>You're receiving this because you enabled weekly digest in Polymath settings.</p>
          <p>Unsubscribe anytime from your settings page.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"Polymath" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your weekly learning digest 🧠 — ${stats.weeklyXP} XP earned!`,
    html,
  })
}

export const sendDailyReminder = async ({ to, name, streak }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; background: #0A0A0F; color: #fff; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 0 auto; padding: 32px 24px; text-align: center; }
        .logo { font-size: 32px; font-weight: 900; color: #FF6B35; }
        .streak { font-size: 64px; margin: 16px 0; }
        .btn { display: inline-block; background: #FF6B35; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 800; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🧪 Polymath</div>
        <div class="streak">🔥</div>
        <h1 style="color: #fff;">Don't break your streak, ${name}!</h1>
        <p style="color: rgba(255,255,255,0.6);">You're on a ${streak}-day streak. Just 5 minutes today keeps it alive!</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Learn Now 🧠</a>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"Polymath" <${process.env.SMTP_USER}>`,
    to,
    subject: `🔥 ${streak}-day streak at risk! Learn something today`,
    html,
  })
}
