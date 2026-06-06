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
                    Text("הגדרות")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("מפתח OpenAI")
                            .font(.dmUI(21, weight: .semibold))
                            .foregroundStyle(theme.colors.textPrimary)

                        Text("שליט המבוך AI נעול עד להגדרת מפתח תקין במסך זה.")
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
                            Text("מפתח שמור: \(keyStore.maskedPreview)")
                                .font(.dmUI(13))
                                .foregroundStyle(theme.colors.textSecondary)
                        }

                        HStack(spacing: 10) {
                            Button("שמור מפתח") {
                                keyStore.save(apiKeyInput)
                                if keyStore.errorMessage == nil {
                                    apiKeyInput = ""
                                    localMessage = "המפתח נשמר ב‑Keychain."
                                } else {
                                    localMessage = keyStore.errorMessage
                                }
                            }
                            .buttonStyle(EmberPrimaryButtonStyle())

                            Button("נקה") {
                                keyStore.clear()
                                apiKeyInput = ""
                                localMessage = keyStore.errorMessage ?? "המפתח השמור הוסר."
                            }
                            .buttonStyle(EmberSecondaryButtonStyle())
                            .frame(width: 110)
                        }
                    }
                    .emberCardStyle()

                    VStack(alignment: .leading, spacing: 10) {
                        Text("מצב דמו זמני")
                            .font(.dmUI(18, weight: .semibold))
                            .foregroundStyle(theme.colors.textPrimary)

                        Text("לבדיקות זמניות בלבד: מאפשר זרימת משחק גם ללא מפתח OpenAI אמיתי.")
                            .font(.dmUI(14))
                            .foregroundStyle(theme.colors.textSecondary)

                        Toggle(isOn: Binding(
                            get: { keyStore.demoModeEnabled },
                            set: { keyStore.setDemoMode($0) }
                        )) {
                            Text("הפעל מצב דמו זמני")
                                .font(.dmUI(15, weight: .medium))
                                .foregroundStyle(theme.colors.textPrimary)
                        }
                        .tint(theme.colors.accent)

                        Button("הפעל דמו במהירות") {
                            keyStore.enableDemoModeQuickly()
                            localMessage = "מצב דמו זמני הופעל."
                        }
                        .buttonStyle(EmberSecondaryButtonStyle())
                    }
                    .emberCardStyle()

                    VStack(alignment: .leading, spacing: 10) {
                        Text("הערות עיצוב")
                            .font(.dmUI(18, weight: .semibold))
                            .foregroundStyle(theme.colors.textPrimary)

                        Text("התמה קבועה: Ember‑Gold על Charcoal. קריינות AI מוצגת בפונט סריפי לקריאות גבוהה.")
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
            if apiKeyInput.isEmpty {
                apiKeyInput = keyStore.rawKey ?? ""
            }
        }
    }
}
