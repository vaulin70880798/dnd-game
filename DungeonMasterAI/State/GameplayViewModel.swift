import Foundation
import SwiftData

enum GameplaySegment: String, CaseIterable, Identifiable {
    case adventure = "Adventure"
    case gameplay = "Gameplay"

    var id: String { rawValue }
}

@MainActor
final class GameplayViewModel: ObservableObject {
    @Published var segment: GameplaySegment = .adventure
    @Published var composerText: String = ""
    @Published var engineSettings = AIEngineSettings.default
    @Published var isSending: Bool = false
    @Published var statusMessage: String?

    let campaign: Campaign

    private let modelContext: ModelContext
    private let keyStore: APIKeyStore
    private let openAIService: OpenAIService

    init(
        campaign: Campaign,
        modelContext: ModelContext,
        keyStore: APIKeyStore,
        openAIService: OpenAIService = OpenAIService()
    ) {
        self.campaign = campaign
        self.modelContext = modelContext
        self.keyStore = keyStore
        self.openAIService = openAIService
    }

    var orderedMessages: [CampaignMessage] {
        campaign.messages.sorted(by: { $0.createdAt < $1.createdAt })
    }

    var isInteractionEnabled: Bool {
        keyStore.hasAPIKey && !isSending
    }

    func sendComposerText() {
        let text = composerText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        composerText = ""
        Task { await submitUserAction(text) }
    }

    func sendRollResult() {
        HapticsManager.diceRoll()
        let roll = Int.random(in: 1...20)
        let text = "Roll result (D20): \(roll)"
        Task { await submitUserAction(text) }
    }

    func applyEngineSettings() {
        statusMessage = "AI settings applied to the next response."
    }

    func resetEngineSettings() {
        engineSettings = .default
        statusMessage = "Engine settings reset."
    }

    private func submitUserAction(_ text: String) async {
        guard let key = keyStore.rawKey, !key.isEmpty else {
            statusMessage = "OpenAI API key missing. Add it in Settings."
            return
        }

        appendMessage(role: .user, text: text)
        isSending = true
        statusMessage = nil

        do {
            let reply = try await openAIService.narrate(
                promptHistory: buildPromptHistory(newInput: text),
                settings: engineSettings,
                apiKey: key
            )
            appendMessage(role: .assistant, text: reply)
            HapticsManager.aiArrival()
            campaign.lastPlayedAt = .now
            campaign.updatedAt = .now
            campaign.totalPlayedMinutes += 1
            campaign.summary = makeSummaryFallback()
            try modelContext.save()
        } catch {
            statusMessage = "The narration failed to load. Check your API key/network."
        }

        isSending = false
    }

    private func appendMessage(role: CampaignRole, text: String) {
        let message = CampaignMessage(role: role, text: text, campaign: campaign)
        campaign.messages.append(message)
        campaign.updatedAt = .now
        campaign.lastPlayedAt = .now
        do {
            try modelContext.save()
        } catch {
            statusMessage = "Failed to save campaign state locally."
        }
    }

    private func buildPromptHistory(newInput: String) -> [OpenAIChatMessage] {
        let setup = """
        You are the Dungeon Master AI narrator.
        Tone: cinematic, dark fantasy, evocative.
        Keep continuity with prior events.
        Campaign context:
        - Hero: \(campaign.heroName)
        - Class/Background: \(campaign.classBackground)
        - Style: \(campaign.narrativeStyle)
        - Chapter: \(campaign.chapter)
        """

        let recent = orderedMessages.suffix(14).map { message in
            OpenAIChatMessage(role: message.role, content: message.text)
        }

        return [OpenAIChatMessage(role: "system", content: setup)] + recent + [
            OpenAIChatMessage(role: "user", content: newInput)
        ]
    }

    private func makeSummaryFallback() -> String {
        let narrativeLines = orderedMessages
            .filter { $0.typedRole == .assistant }
            .suffix(2)
            .map(\.text)
            .joined(separator: " ")

        return narrativeLines.isEmpty ? campaign.summary : narrativeLines
    }
}
