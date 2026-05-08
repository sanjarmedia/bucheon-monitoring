import { google } from "googleapis"

export class GoogleSheetsService {
  /**
   * IMPORTANT: 
   * To use this service, you must have a Service Account JSON file from Google Cloud.
   * Add the credentials to the root of the project (e.g. google-credentials.json)
   * and set GOOGLE_APPLICATION_CREDENTIALS="google-credentials.json" in your .env
   */
  private static async getAuthClient() {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      return await auth.getClient()
    } catch (error) {
      console.error("Google Auth Error:", error)
      return null
    }
  }

  static async exportToGoogleSheets(spreadsheetId: string, range: string, data: any[][]) {
    const authClient = await this.getAuthClient()
    if (!authClient) return false

    const sheets = google.sheets({ version: 'v4', auth: authClient as any })

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data,
        },
      })
      return true
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error)
      return false
    }
  }

  static async importFromGoogleSheets(spreadsheetId: string, range: string) {
    const authClient = await this.getAuthClient()
    if (!authClient) return null

    const sheets = google.sheets({ version: 'v4', auth: authClient as any })

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })
      return response.data.values
    } catch (error) {
      console.error("Error importing from Google Sheets:", error)
      return null
    }
  }
}
