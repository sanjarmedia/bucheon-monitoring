export class TelegramService {
  private static BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  private static GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID

  /**
   * Sends a message to a Telegram group.
   * Useful for new support tickets or urgent alerts.
   */
  static async sendMessage(text: string) {
    const { prisma } = await import("@/lib/prisma")
    
    // Fetch from DB first
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['tg_token', 'tg_chat_id', 'tg_enabled'] } }
    })
    
    // If the setting exists in DB, it is the source of truth. Env vars are only a fallback when no setting is saved.
    const enabledSetting = settings.find(s => s.key === 'tg_enabled')?.value
    const enabled = enabledSetting !== undefined
      ? enabledSetting === 'on'
      : Boolean(process.env.TELEGRAM_BOT_TOKEN)
    if (!enabled) return false

    const token = settings.find(s => s.key === 'tg_token')?.value || process.env.TELEGRAM_BOT_TOKEN
    const chatId = settings.find(s => s.key === 'tg_chat_id')?.value || process.env.TELEGRAM_GROUP_CHAT_ID

    if (!token || !chatId) {
      console.warn("Telegram BOT_TOKEN or GROUP_CHAT_ID not configured.")
      return false
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
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
   * Escapes HTML special characters for Telegram's HTML parse mode.
   */
  static escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
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

<b>👤 Kimdan:</b> ${this.escapeHtml(ticket.creatorName)}
<b>📂 Kategoriya:</b> ${this.escapeHtml(ticket.category)}
<b>📍 Joylashuv:</b> ${this.escapeHtml(ticket.faculty || 'Noma\'lum')} - ${this.escapeHtml(ticket.roomName || 'Noma\'lum')}
<b>⚠️ Prioritet:</b> ${ticket.priority}

<b>📝 Tavsif:</b>
<i>${this.escapeHtml(ticket.description)}</i>

<a href="${process.env.NEXTAUTH_URL}/requests">Tizimda ko'rish</a>
    `
  }
}
