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
                    Text("הקמפיינים שלי")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)
                        .padding(.bottom, 6)

                    if campaigns.isEmpty {
                        Text("אין קמפיינים שמורים עדיין. אפשר להתחיל קמפיין חדש ממסך הבית.")
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
            return "\(hours)ש׳ \(minutes)ד׳ משחק"
        }
        return "\(minutes)ד׳ משחק"
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
                Text(campaign.isFinished ? "הסתיים" : "שוחק לאחרונה: \(relativeDate(campaign.lastPlayedAt))")
                    .font(.dmUI(13))
                    .foregroundStyle(theme.colors.textSecondary)
                Spacer()

                if campaign.isFinished {
                    Button("צפה בתקציר", action: onSummary)
                        .buttonStyle(EmberPrimaryButtonStyle())
                        .frame(width: 146)
                } else {
                    Button("המשך", action: onResume)
                        .buttonStyle(EmberPrimaryButtonStyle())
                        .frame(width: 108)
                }
            }
        }
        .emberCardStyle()
    }

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "he_IL")
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

                    Text("הסיפור עד כה")
                        .font(.dmUI(18, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)

                    Text(
                        campaign.summary.isEmpty
                            ? "עדיין אין תקציר זמין. המשך לשחק כדי לייצר אחד."
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
                    Button("סיום") { dismiss() }
                        .tint(theme.colors.accent)
                }
            }
        }
    }
}

