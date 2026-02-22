import SwiftData
import SwiftUI

@main
struct DungeonMasterAIApp: App {
    @StateObject private var theme = ThemeManager()
    @StateObject private var appState = AppState()
    @StateObject private var keyStore = APIKeyStore()

    private let modelContainer: ModelContainer = {
        let configuration = ModelConfiguration(isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(
                for: Campaign.self,
                CampaignMessage.self,
                CodexCard.self,
                configurations: configuration
            )
        } catch {
            fatalError("Failed to create model container: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            RootContainerView()
                .environmentObject(theme)
                .environmentObject(appState)
                .environmentObject(keyStore)
                .preferredColorScheme(.dark)
        }
        .modelContainer(modelContainer)
    }
}
