import SwiftData
import SwiftUI

struct RootContainerView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore
    @Environment(\.modelContext) private var modelContext

    @State private var showSplash = true
    @State private var splashOpacity = 1.0

    var body: some View {
        ZStack {
            theme.colors.background.ignoresSafeArea()

            if showSplash {
                SplashView()
                    .opacity(splashOpacity)
                    .transition(.opacity)
            } else {
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.4), value: showSplash)
        .sheet(isPresented: $appState.showSetupWizard) {
            SetupWizardView { campaign in
                appState.showSetupWizard = false
                appState.activeCampaign = campaign
            }
            .environmentObject(theme)
            .environmentObject(appState)
            .environmentObject(keyStore)
        }
        .fullScreenCover(
            isPresented: Binding(
                get: { appState.activeCampaign != nil },
                set: { isOpen in
                    if !isOpen { appState.activeCampaign = nil }
                }
            )
        ) {
            if let campaign = appState.activeCampaign {
                GameplayView(campaign: campaign, modelContext: modelContext, keyStore: keyStore)
                    .environmentObject(theme)
                    .environmentObject(appState)
                    .environmentObject(keyStore)
            }
        }
        .overlay(alignment: .top) {
            if let toast = appState.toastMessage {
                ToastView(message: toast)
                    .padding(.top, 16)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
                            withAnimation(.easeOut(duration: 0.25)) {
                                appState.toastMessage = nil
                            }
                        }
                    }
            }
        }
        .onAppear {
            SeedData.bootstrapIfNeeded(modelContext: modelContext)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                withAnimation(.easeOut(duration: 0.45)) {
                    splashOpacity = 0
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                withAnimation(.easeInOut(duration: 0.3)) {
                    showSplash = false
                }
            }
        }
    }
}
