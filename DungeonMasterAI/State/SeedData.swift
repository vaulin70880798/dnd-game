import Foundation
import SwiftData

enum SeedData {
    static func bootstrapIfNeeded(modelContext: ModelContext) {
        do {
            let campaignsCount = try modelContext.fetchCount(FetchDescriptor<Campaign>())
            let codexCount = try modelContext.fetchCount(FetchDescriptor<CodexCard>())

            if codexCount == 0 {
                let cards: [CodexCard] = [
                    CodexCard(
                        title: "אבירי הגבורה",
                        lore: "אחווה עתיקה שנשבעה להגן על מקדשי הגחלת מפני פשיטות ילידי-צל.",
                        kind: .faction
                    ),
                    CodexCard(
                        title: "דמות מסתורית",
                        lore: "דמות עטוית ברדס שמופיעה בכל פעם שהירח מכסה את מגדל המשמר הצפוני.",
                        kind: .npc
                    ),
                    CodexCard(
                        title: "דרקון קדום",
                        lore: "תנין-אש רדום מתחת לרכסי הבזלת, הממתין לאות האחרון.",
                        kind: .npc
                    ),
                    CodexCard(
                        title: "שריד זוהר",
                        lore: "שריד שבור המהמהם כאשר סכנה מתקרבת.",
                        kind: .item
                    )
                ]
                cards.forEach(modelContext.insert)
            }

            if campaignsCount == 0 {
                let campaign = Campaign(
                    title: "מצודת האובסידיאן - פרק 3",
                    genre: "אימה גותית",
                    heroName: "אלארה ואנס",
                    classBackground: "סיירת, אצילה גולה",
                    narrativeStyle: "קשוח",
                    chapter: 3,
                    totalPlayedMinutes: 270,
                    summary: "אלארה הגיעה למצודה החרבה ושמעה את השרשראות מתחת לקפלה."
                )

                let welcome = CampaignMessage(
                    role: .assistant,
                    text: "רוח קרה שוטפת את השער ההרוס, ואור גחלים מרצד על אבן סדוקה.",
                    campaign: campaign
                )
                campaign.messages.append(welcome)
                modelContext.insert(campaign)
            }

            try modelContext.save()
        } catch {
            // Best-effort seeding only; failing here should not crash app startup.
        }
    }
}
