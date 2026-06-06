import Foundation
import SwiftData

enum CodexKind: String, CaseIterable, Codable {
    case npc = "דמות"
    case item = "חפץ"
    case location = "מיקום"
    case faction = "סיעה"
}

@Model
final class CodexCard {
    @Attribute(.unique) var id: UUID
    var title: String
    var lore: String
    var kind: String
    var createdAt: Date

    init(
        id: UUID = UUID(),
        title: String,
        lore: String,
        kind: CodexKind,
        createdAt: Date = .now
    ) {
        self.id = id
        self.title = title
        self.lore = lore
        self.kind = kind.rawValue
        self.createdAt = createdAt
    }

    var typedKind: CodexKind {
        CodexKind(rawValue: kind) ?? .npc
    }
}
