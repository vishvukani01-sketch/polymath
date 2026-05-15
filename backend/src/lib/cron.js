import cron from 'node-cron'
import { supabase } from './supabase.js'
import { sendWeeklyDigest, sendDailyReminder } from './mailer.js'

export const startCronJobs = () => {
  // Daily reminder — every day at 6 PM UTC
  cron.schedule('0 18 * * *', async () => {
    console.log('Running daily reminder job...')
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: users } = await supabase
        .from('profiles')
        .select('email, display_name, streak_days, last_activity_date, reminder_enabled')
        .eq('reminder_enabled', true)

      if (!users) return

      for (const user of users) {
        if (user.last_activity_date !== today && user.streak_days > 0) {
          await sendDailyReminder({
            to: user.email,
            name: user.display_name,
            streak: user.streak_days,
          })
        }
      }
      console.log(`Daily reminders sent to ${users.length} users`)
    } catch (err) {
      console.error('Daily reminder error:', err)
    }
  })

  // Weekly digest — every Sunday at 9 AM UTC
  cron.schedule('0 9 * * 0', async () => {
    console.log('Running weekly digest job...')
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('*, activity_log(*)')
        .eq('weekly_digest', true)

      if (!users) return

      for (const user of users) {
        const weeklyXP = user.activity_log
          ?.filter(log => new Date(log.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          ?.reduce((sum, log) => sum + (log.xp_earned || 0), 0) || 0

        const cardsCompleted = user.activity_log
          ?.filter(log => new Date(log.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          ?.reduce((sum, log) => sum + (log.cards_completed || 0), 0) || 0

        await sendWeeklyDigest({
          to: user.email,
          name: user.display_name,
          stats: { weeklyXP, streak: user.streak_days, cardsCompleted, level: user.level },
          domains: (user.selected_domains || []).map(id => ({ id, emoji: '📚', name: id })),
        })
      }
      console.log('Weekly digests sent')
    } catch (err) {
      console.error('Weekly digest error:', err)
    }
  })
}
