import SwiftData
import SwiftUI

struct CampaignsView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore

    @Query(sort: \Campaign.lastPlayedAt, order: .reverse) private var campaigns: [Campaign]
    @State private var summaryTarget: Campaign?

    var body: some View {
        ZStack {
            theme.colors.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text("My Campaigns")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)
                        .padding(.bottom, 6)

                    if campaigns.isEmpty {
                        Text("No saved campaigns yet. Start one from Home.")
                            .font(.dmUI(15))
                            .foregroundStyle(theme.colors.textSecondary)
                            .padding(.top, 12)
                    } else {
                        ForEach(campaigns, id: \.id) { campaign in
                            CampaignListCard(
                                campaign: campaign,
                                onResume: {
                                    appState.requireAPIKey(using: keyStore) {
                                        appState.activeCampaign = campaign
                                    }
                                },
                                onSummary: { summaryTarget = campaign }
                            )
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 18)
                .padding(.bottom, 20)
            }
        }
        .navigationBarHidden(true)
        .sheet(item: $summaryTarget) { campaign in
            SummarySheet(campaign: campaign)
                .environmentObject(theme)
        }
    }
}

private struct CampaignListCard: View {
    @EnvironmentObject private var theme: ThemeManager
    let campaign: Campaign
    let onResume: () -> Void
    let onSummary: () -> Void

    private var progress: Double {
        min(1, Double(campaign.totalPlayedMinutes) / 300)
    }

    private var playedText: String {
        let hours = campaign.totalPlayedMinutes / 60
        let minutes = campaign.totalPlayedMinutes % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m Played"
        }
        return "\(minutes)m Played"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#334351"), Color(hex: "#151A23")],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 66, height: 66)
                    .overlay(
                        Image(systemName: "building.columns.fill")
                            .foregroundStyle(theme.colors.textSecondary.opacity(0.45))
                    )

                VStack(alignment: .leading, spacing: 8) {
                    Text(campaign.title)
                        .font(.dmUI(22, weight: .semibold))
                        .foregroundStyle(theme.colors.textPrimary)
                        .lineLimit(2)

                    ProgressView(value: progress)
                        .tint(theme.colors.accent)

                    Text(playedText)
                        .font(.dmUI(13))
                        .foregroundStyle(theme.colors.textSecondary)
                }
                Spacer(minLength: 0)
            }

            HStack {
                Text(campaign.isFinished ? "Finished" : "Last played: \(relativeDate(campaign.lastPlayedAt))")
                    .font(.dmUI(13))
                    .foregroundStyle(theme.colors.textSecondary)
                Spacer()

                if campaign.isFinished {
                    Button("View Summary", action: onSummary)
                        .buttonStyle(EmberPrimaryButtonStyle())
                        .frame(width: 146)
                } else {
                    Button("Resume", action: onResume)
                        .buttonStyle(EmberPrimaryButtonStyle())
                        .frame(width: 108)
                }
            }
        }
        .emberCardStyle()
    }

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: .now)
    }
}

private struct SummarySheet: View {
    @EnvironmentObject private var theme: ThemeManager
    let campaign: Campaign
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(campaign.title)
                        .font(.dmUI(30, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)

                    Text("Story So Far")
                        .font(.dmUI(18, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)

                    Text(
                        campaign.summary.isEmpty
                            ? "No summary available yet. Continue the campaign to generate one."
                            : campaign.summary
                    )
                    .font(.dmStory(19))
                    .foregroundStyle(theme.colors.textPrimary)
                    .lineSpacing(6)
                }
                .padding(18)
            }
            .background(theme.colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .tint(theme.colors.accent)
                }
            }
        }
    }
}

