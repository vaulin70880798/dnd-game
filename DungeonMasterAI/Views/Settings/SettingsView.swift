import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var keyStore: APIKeyStore
    @State private var apiKeyInput: String = ""
    @State private var revealKey = false
    @State private var localMessage: String?

    var body: some View {
        ZStack {
            theme.colors.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Settings")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("OpenAI API Key")
                            .font(.dmUI(21, weight: .semibold))
                            .foregroundStyle(theme.colors.textPrimary)

                        Text("Dungeon Master AI is locked until a valid OpenAI key is configured here.")
                            .font(.dmUI(14))
                            .foregroundStyle(theme.colors.textSecondary)

                        HStack(spacing: 10) {
                            Group {
                                if revealKey {
                                    TextField("sk-...", text: $apiKeyInput)
                                } else {
                                    SecureField("sk-...", text: $apiKeyInput)
                                }
                            }
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.dmUI(16))
                            .padding(12)
                            .background(theme.colors.background.opacity(0.85))
                            .clipShape(RoundedRectangle(cornerRadius: 11))
                            .overlay(
                                RoundedRectangle(cornerRadius: 11)
                                    .stroke(theme.colors.border.opacity(0.5), lineWidth: 0.5)
                            )

                            Button {
                                revealKey.toggle()
                            } label: {
                                Image(systemName: revealKey ? "eye.slash" : "eye")
                                    .font(.dmUI(16, weight: .semibold))
                            }
                            .buttonStyle(EmberSecondaryButtonStyle())
                        }

                        if keyStore.hasAPIKey, !keyStore.maskedPreview.isEmpty {
                            Text("Stored key: \(keyStore.maskedPreview)")
                                .font(.dmUI(13))
                                .foregroundStyle(theme.colors.textSecondary)
                        }

                        HStack(spacing: 10) {
                            Button("Save Key") {
                                keyStore.save(apiKeyInput)
                                if keyStore.errorMessage == nil {
                                    apiKeyInput = ""
                                    localMessage = "API key saved to Keychain."
                                } else {
                                    localMessage = keyStore.errorMessage
                                }
                            }
                            .buttonStyle(EmberPrimaryButtonStyle())

                            Button("Clear") {
                                keyStore.clear()
                                apiKeyInput = ""
                                localMessage = keyStore.errorMessage ?? "Saved key removed."
                            }
                            .buttonStyle(EmberSecondaryButtonStyle())
                            .frame(width: 110)
                        }
                    }
                    .emberCardStyle()

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Design Notes")
                            .font(.dmUI(18, weight: .semibold))
                            .foregroundStyle(theme.colors.textPrimary)

                        Text("Theme is locked to Ember-Gold on Charcoal. AI narration uses serif typography for story readability.")
                            .font(.dmUI(14))
                            .foregroundStyle(theme.colors.textSecondary)
                    }
                    .emberCardStyle()
                }
                .padding(18)
                .padding(.bottom, 20)
            }
        }
        .navigationBarHidden(true)
        .overlay(alignment: .bottom) {
            if let localMessage {
                ToastView(message: localMessage)
                    .padding(.bottom, 14)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) {
                            withAnimation { self.localMessage = nil }
                        }
                    }
            }
        }
        .onAppear {
            keyStore.load()
        }
    }
}
