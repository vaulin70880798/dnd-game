import SwiftUI

struct GameLogView: View {
    @EnvironmentObject private var theme: ThemeManager
    let campaign: Campaign
    let messages: [CampaignMessage]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10, pinnedViews: []) {
                    ParallaxHeader(
                        title: campaign.title,
                        subtitle: "\(campaign.genre) • \(campaign.heroName)"
                    )

                    ForEach(messages, id: \.id) { message in
                        MessageRow(message: message)
                            .id(message.id)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .padding(.bottom, 12)
            }
            .coordinateSpace(name: "GAMELOG")
            .onAppear {
                scrollToBottom(proxy: proxy)
            }
            .onChange(of: messages.map(\.id)) { _ in
                withAnimation(.easeInOut(duration: 0.35)) {
                    scrollToBottom(proxy: proxy)
                }
            }
        }
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard let lastID = messages.last?.id else { return }
        proxy.scrollTo(lastID, anchor: .bottom)
    }
}

private struct MessageRow: View {
    @EnvironmentObject private var theme: ThemeManager
    let message: CampaignMessage
    @State private var visible = false

    var body: some View {
        HStack {
            if message.typedRole == .user {
                Spacer(minLength: 32)
                Text(message.text)
                    .font(.dmUI(24, weight: .bold))
                    .foregroundStyle(theme.colors.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(theme.colors.surface.opacity(0.95))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(theme.colors.border, lineWidth: 0.5)
                    )
            } else {
                Text(message.text)
                    .font(.dmStory(22))
                    .foregroundStyle(theme.colors.textPrimary.opacity(0.95))
                    .lineSpacing(5)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(theme.colors.surface.opacity(0.72))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(theme.colors.border.opacity(0.45), lineWidth: 0.5)
                    )
                Spacer(minLength: 24)
            }
        }
        .padding(.horizontal, 12)
        .opacity(visible ? 1 : 0)
        .offset(y: visible ? 0 : 8)
        .onAppear {
            withAnimation(.easeOut(duration: 0.24)) {
                visible = true
            }
        }
    }
}
