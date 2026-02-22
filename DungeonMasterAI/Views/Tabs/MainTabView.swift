import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            NavigationStack {
                LibraryView()
            }
            .tag(RootTab.home)
            .tabItem {
                Label("Home", systemImage: "house")
            }

            NavigationStack {
                CampaignsView()
            }
            .tag(RootTab.campaigns)
            .tabItem {
                Label("Campaigns", systemImage: "shield")
            }

            NavigationStack {
                CodexView()
            }
            .tag(RootTab.codex)
            .tabItem {
                Label("Codex", systemImage: "book.closed")
            }

            NavigationStack {
                SettingsView()
            }
            .tag(RootTab.settings)
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .tint(theme.colors.accent)
        .toolbarBackground(theme.colors.background, for: .tabBar)
        .toolbarColorScheme(.dark, for: .tabBar)
        .overlay {
            if !keyStore.hasAPIKey && appState.selectedTab != .settings {
                ZStack {
                    Color.black.opacity(0.58).ignoresSafeArea()
                    VStack(spacing: 12) {
                        Image(systemName: "lock.shield")
                            .font(.system(size: 40))
                            .foregroundStyle(theme.colors.accent)
                        Text("OpenAI key required")
                            .font(.dmUI(24, weight: .bold))
                            .foregroundStyle(theme.colors.textPrimary)
                        Text("Set your API key in Settings to unlock gameplay, campaigns, and codex sync.")
                            .font(.dmUI(14))
                            .foregroundStyle(theme.colors.textSecondary)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 320)
                        Button("Open Settings") {
                            appState.selectedTab = .settings
                        }
                        .buttonStyle(EmberPrimaryButtonStyle())
                        .frame(width: 220)
                    }
                    .padding(20)
                    .glassPanelStyle()
                    .padding(.horizontal, 28)
                }
            }
        }
    }
}
