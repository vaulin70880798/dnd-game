import Foundation
import SwiftData

enum CampaignRole: String, CaseIterable, Codable {
    case user
    case assistant
    case system
}

@Model
final class CampaignMessage {
    @Attribute(.unique) var id: UUID
    var role: String
    var text: String
    var createdAt: Date
    @Relationship(inverse: \Campaign.messages)
    var campaign: Campaign?

    init(
        id: UUID = UUID(),
        role: CampaignRole,
        text: String,
        createdAt: Date = .now,
        campaign: Campaign? = nil
    ) {
        self.id = id
        self.role = role.rawValue
        self.text = text
        self.createdAt = createdAt
        self.campaign = campaign
    }

    var typedRole: CampaignRole {
        CampaignRole(rawValue: role) ?? .assistant
    }
}
