import express from 'express'
import { sendWeeklyDigest, sendDailyReminder } from '../lib/mailer.js'

const router = express.Router()

// Manual trigger for testing
router.post('/test-reminder', async (req, res) => {
  const { email, name, streak } = req.body
  try {
    await sendDailyReminder({ to: email, name, streak })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/test-digest', async (req, res) => {
  const { email, name } = req.body
  try {
    await sendWeeklyDigest({
      to: email,
      name,
      stats: { weeklyXP: 250, streak: 7, cardsCompleted: 14, level: 3 },
      domains: [{ emoji: '🔬', name: 'Science' }, { emoji: '🧠', name: 'Philosophy' }],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
