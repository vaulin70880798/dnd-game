import Foundation

enum RootTab: Hashable {
    case home
    case campaigns
    case codex
    case settings
}

@MainActor
final class AppState: ObservableObject {
    @Published var selectedTab: RootTab = .home
    @Published var showSetupWizard = false
    @Published var activeCampaign: Campaign?
    @Published var toastMessage: String?

    func requireAPIKey(using keyStore: APIKeyStore, onSuccess: () -> Void) {
        guard keyStore.isUnlocked else {
            toastMessage = "נדרש מפתח OpenAI. הגדר בהגדרות או הפעל מצב דמו זמני."
            selectedTab = .settings
            return
        }
        onSuccess()
    }
}
