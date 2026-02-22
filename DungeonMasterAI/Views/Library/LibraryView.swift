import SwiftData
import SwiftUI

struct LibraryView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore

    @Query(sort: \Campaign.updatedAt, order: .reverse) private var campaigns: [Campaign]

    private let realms: [(title: String, subtitle: String, symbol: String)] = [
        ("Gothic Horror", "Haunted keeps and cursed bloodlines", "moon.stars.fill"),
        ("High Fantasy", "Ancient kingdoms and forgotten relics", "sparkles"),
        ("Cyberpunk", "Neon ruins and synthetic prophecies", "cpu.fill"),
        ("Mythic Seas", "Storm temples and leviathan cults", "drop.fill")
    ]

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            theme.colors.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("Your Chronicles")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 14) {
                            if campaigns.isEmpty {
                                EmptyChronicleCard()
                            } else {
                                ForEach(Array(campaigns.prefix(8)), id: \.id) { campaign in
                                    ChronicleCard(campaign: campaign) {
                                        appState.requireAPIKey(using: keyStore) {
                                            appState.activeCampaign = campaign
                                        }
                                    }
                                    .frame(width: 285)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    Text("Explore New Realms")
                        .font(.dmUI(28, weight: .semibold))
                        .foregroundStyle(theme.colors.textPrimary)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(realms, id: \.title) { realm in
                                RealmCard(realm: realm) {
                                    appState.requireAPIKey(using: keyStore) {
                                        appState.showSetupWizard = true
                                    }
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 18)
                .padding(.bottom, 120)
            }

            Button {
                appState.requireAPIKey(using: keyStore) {
                    appState.showSetupWizard = true
                }
            } label: {
                Image(systemName: "plus")
                    .font(.dmUI(24, weight: .bold))
                    .foregroundStyle(Color.black.opacity(0.85))
                    .frame(width: 58, height: 58)
                    .background(
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "#FFD877"), theme.colors.accent],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(color: theme.colors.accent.opacity(0.45), radius: 12, x: 0, y: 0)
            }
            .padding(.trailing, 22)
            .padding(.bottom, 26)
        }
        .navigationBarHidden(true)
    }
}

private struct ChronicleCard: View {
    @EnvironmentObject private var theme: ThemeManager
    let campaign: Campaign
    let onResume: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(hex: "#324155"),
                                Color(hex: "#161A23"),
                                Color.black.opacity(0.85)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: 154)

                Image(systemName: "castle.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(theme.colors.textSecondary.opacity(0.35))
                    .padding(14)
            }

            Text(campaign.title)
                .font(.dmUI(21, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)
                .lineLimit(2)

            Text(campaign.summary.isEmpty ? "A dark oath awaits beyond the shattered gate." : campaign.summary)
                .font(.dmUI(14, weight: .regular))
                .foregroundStyle(theme.colors.textSecondary)
                .lineLimit(2)

            Button("Resume", action: onResume)
                .buttonStyle(EmberSecondaryButtonStyle())
                .frame(maxWidth: 126)
        }
        .emberCardStyle()
    }
}

private struct RealmCard: View {
    @EnvironmentObject private var theme: ThemeManager
    let realm: (title: String, subtitle: String, symbol: String)
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 10) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#2A313D"), Color(hex: "#101319")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 82)
                    .overlay(
                        Image(systemName: realm.symbol)
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(theme.colors.textSecondary.opacity(0.7))
                    )

                Text(realm.title)
                    .font(.dmUI(18, weight: .semibold))
                    .foregroundStyle(theme.colors.textPrimary)
                    .lineLimit(1)

                Text(realm.subtitle)
                    .font(.dmUI(12))
                    .foregroundStyle(theme.colors.textSecondary)
                    .lineLimit(2)
            }
            .frame(width: 156, alignment: .leading)
            .emberCardStyle()
        }
        .buttonStyle(.plain)
    }
}

private struct EmptyChronicleCard: View {
    @EnvironmentObject private var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("No campaigns yet")
                .font(.dmUI(22, weight: .bold))
                .foregroundStyle(theme.colors.textPrimary)
            Text("Tap any New Realm card to create your first adventure.")
                .font(.dmUI(15))
                .foregroundStyle(theme.colors.textSecondary)
                .lineLimit(2)
        }
        .frame(width: 300, height: 190, alignment: .topLeading)
        .emberCardStyle()
    }
}
