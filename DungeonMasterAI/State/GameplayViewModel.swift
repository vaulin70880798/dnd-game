import Foundation
import SwiftData

enum GameplaySegment: String, CaseIterable, Identifiable {
    case adventure = "הרפתקה"
    case gameplay = "משחקיות"

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
        keyStore.isUnlocked && !isSending
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
        let text = "תוצאת גלגול (D20): \(roll)"
        Task { await submitUserAction(text) }
    }

    func applyEngineSettings() {
        statusMessage = "הגדרות המנוע הוחלו על התגובה הבאה."
    }

    func resetEngineSettings() {
        engineSettings = .default
        statusMessage = "הגדרות המנוע אופסו."
    }

    private func submitUserAction(_ text: String) async {
        appendMessage(role: .user, text: text)
        isSending = true
        statusMessage = nil

        // Temporary demo path for flow testing without a real key.
        if keyStore.demoModeEnabled, (keyStore.rawKey?.isEmpty ?? true) {
            let demo = demoNarration(for: text)
            appendMessage(role: .assistant, text: demo)
            HapticsManager.aiArrival()
            campaign.lastPlayedAt = .now
            campaign.updatedAt = .now
            campaign.totalPlayedMinutes += 1
            campaign.summary = makeSummaryFallback()
            try? modelContext.save()
            isSending = false
            return
        }

        guard let key = keyStore.rawKey, !key.isEmpty else {
            statusMessage = "מפתח OpenAI חסר. הוסף בהגדרות או הפעל מצב דמו זמני."
            isSending = false
            return
        }

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
            if keyStore.demoModeEnabled {
                appendMessage(role: .assistant, text: demoNarration(for: text))
                HapticsManager.aiArrival()
                campaign.lastPlayedAt = .now
                campaign.updatedAt = .now
                campaign.totalPlayedMinutes += 1
                campaign.summary = makeSummaryFallback()
                try? modelContext.save()
            } else {
                statusMessage = "טעינת הקריינות נכשלה. בדוק מפתח/רשת."
            }
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
            statusMessage = "שמירת מצב הקמפיין נכשלה."
        }
    }

    private func buildPromptHistory(newInput: String) -> [OpenAIChatMessage] {
        let setup = """
        אתה שליט המבוך AI.
        כתוב בעברית בלבד, בסגנון קולנועי של פנטזיה אפלה.
        שמור רצף עלילתי מול האירועים הקודמים.
        הקשר קמפיין:
        - גיבור: \(campaign.heroName)
        - מקצוע/רקע: \(campaign.classBackground)
        - סגנון: \(campaign.narrativeStyle)
        - פרק: \(campaign.chapter)
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

    private func demoNarration(for input: String) -> String {
        let options = [
            "קרן רחוקה עונה למהלך שלך, ואור לפידים חושף גרם מדרגות נסתר מתחת לקפלה.",
            "הבחירה שלך מהדהדת באולמות האבן הלחים. אבק נושר וסמל עתיק מתעורר באור גחלים.",
            "פלדה שרה בחושך והצללים נסוגים. קשת אטומה נפתחת בחריקה של תפילה נשכחת.",
            "מתוך הערפל מופיע צופה עטוי גלימה וקורא בשמך תחת ירח דם."
        ]

        let selected = options.randomElement() ?? options[0]
        return "\(selected)\n\n(תגובה זמנית ממצב דמו עבור: \"\(input)\")"
    }
}
