import Foundation
import SwiftData

@Model
final class Campaign {
    @Attribute(.unique) var id: UUID
    var title: String
    var genre: String
    var heroName: String
    var classBackground: String
    var narrativeStyle: String
    var chapter: Int
    var createdAt: Date
    var updatedAt: Date
    var lastPlayedAt: Date
    var totalPlayedMinutes: Int
    var isFinished: Bool
    var summary: String

    @Relationship(deleteRule: .cascade, inverse: \CampaignMessage.campaign)
    var messages: [CampaignMessage]

    init(
        id: UUID = UUID(),
        title: String,
        genre: String,
        heroName: String,
        classBackground: String,
        narrativeStyle: String,
        chapter: Int = 1,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        lastPlayedAt: Date = .now,
        totalPlayedMinutes: Int = 0,
        isFinished: Bool = false,
        summary: String = "",
        messages: [CampaignMessage] = []
    ) {
        self.id = id
        self.title = title
        self.genre = genre
        self.heroName = heroName
        self.classBackground = classBackground
        self.narrativeStyle = narrativeStyle
        self.chapter = chapter
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.lastPlayedAt = lastPlayedAt
        self.totalPlayedMinutes = totalPlayedMinutes
        self.isFinished = isFinished
        self.summary = summary
        self.messages = messages
    }
}
