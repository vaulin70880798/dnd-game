import Foundation

struct AIEngineSettings: Equatable {
    var temperature: Double = 0.7
    var maxCharacters: Double = 250
    var topP: Double = 0.9
    var topK: Double = 40

    static let `default` = AIEngineSettings()
}

struct CharacterDraft: Decodable {
    let name: String
    let classBackground: String
    let style: String
    let campaignTitle: String
}
