export class TelegramService {
  private static BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  private static GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID

  /**
   * Sends a message to a Telegram group.
   * Useful for new support tickets or urgent alerts.
   */
  static async sendMessage(text: string) {
    if (!this.BOT_TOKEN || !this.GROUP_CHAT_ID) {
      console.warn("Telegram BOT_TOKEN or GROUP_CHAT_ID not configured.")
      return false
    }

    try {
      const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.GROUP_CHAT_ID,
          text: text,
          parse_mode: "HTML",
        }),
      })

      const data = await response.json()
      return data.ok
    } catch (error) {
      console.error("Telegram Notification Error:", error)
      return false
    }
  }

  /**
   * Formats a ticket for Telegram notification.
   */
  static formatTicketMessage(ticket: {
    id: string
    category: string
    description: string
    roomName?: string
    faculty?: string
    creatorName: string
    priority: string
  }) {
    const priorityEmoji = 
      ticket.priority === 'URGENT' ? '🚨' : 
      ticket.priority === 'HIGH' ? '🔴' : 
      ticket.priority === 'NORMAL' ? '🟡' : '🟢'

    return `
<b>${priorityEmoji} Yangi Zayavka (Support Ticket)</b>

<b>👤 Kimdan:</b> ${ticket.creatorName}
<b>📂 Kategoriya:</b> ${ticket.category}
<b>📍 Joylashuv:</b> ${ticket.faculty || 'Noma\'lum'} - ${ticket.roomName || 'Noma\'lum'}
<b>⚠️ Prioritet:</b> ${ticket.priority}

<b>📝 Tavsif:</b>
<i>${ticket.description}</i>

<a href="${process.env.NEXTAUTH_URL}/requests">Tizimda ko'rish</a>
    `
  }
}
