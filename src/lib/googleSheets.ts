import { google } from "googleapis"

// To use this, the user must provide a SERVICE_ACCOUNT_JSON inside their environment variables.
// They also need to provide the SPREADSHEET_ID.
export async function syncToGoogleSheets(action: 'CREATE' | 'UPDATE' | 'DELETE', itemData: any) {
  try {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    
    if (!credentials || !spreadsheetId) {
      console.warn("Google Sheets sync skipped: GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SPREADSHEET_ID is missing in .env")
      return
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // For a real integration, you would query the sheet for the specific ID and update/delete the exact row.
    // Here we will just append a log for simplicity, but in production, we would use batchUpdate or update.
    
    if (action === 'CREATE') {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:G", // Assuming a basic sheet structure
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              itemData.id,
              itemData.name,
              itemData.categoryId,
              itemData.serialNumber || "",
              itemData.status,
              itemData.cost || "",
              new Date().toISOString()
            ]
          ]
        }
      })
      console.log("Successfully synced CREATE to Google Sheets")
    }
    // Logic for UPDATE and DELETE would go here (requires reading rows to find the matching ID first)

  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error)
  }
}
