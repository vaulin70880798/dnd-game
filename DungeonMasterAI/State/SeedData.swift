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
                        title: "The Valorous Knights",
                        lore: "An ancient brotherhood sworn to guard ember shrines against shadowborn raids.",
                        kind: .faction
                    ),
                    CodexCard(
                        title: "Mysterious Character",
                        lore: "A hooded figure who appears whenever the moon eclipses the north watchtower.",
                        kind: .npc
                    ),
                    CodexCard(
                        title: "Ancient Dragon",
                        lore: "A dormant wyrm beneath the basalt ridges, waiting for the final omen.",
                        kind: .npc
                    ),
                    CodexCard(
                        title: "Glowing Artifact",
                        lore: "A fractured relic that hums when danger approaches.",
                        kind: .item
                    )
                ]
                cards.forEach(modelContext.insert)
            }

            if campaignsCount == 0 {
                let campaign = Campaign(
                    title: "The Obsidian Keep - Chapter 3",
                    genre: "Gothic Horror",
                    heroName: "Elara Vance",
                    classBackground: "Ranger, Exiled Noble",
                    narrativeStyle: "Gritty",
                    chapter: 3,
                    totalPlayedMinutes: 270,
                    summary: "Elara reached the ruined keep and heard the chains beneath its chapel."
                )

                let welcome = CampaignMessage(
                    role: .assistant,
                    text: "A cold wind sweeps the ruined gate as ember-light flickers across cracked stone.",
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
