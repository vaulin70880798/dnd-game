import SwiftUI

struct ParallaxHeader: View {
    @EnvironmentObject private var theme: ThemeManager
    let title: String
    let subtitle: String

    var body: some View {
        GeometryReader { geo in
            let minY = geo.frame(in: .named("GAMELOG")).minY
            let stretch = max(0, minY)
            let height = 250 + stretch

            ZStack(alignment: .bottomLeading) {
                RoundedRectangle(cornerRadius: 0)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#405264"), Color(hex: "#17202C"), Color.black],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .overlay(
                        Image(systemName: "moon.haze.fill")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 230)
                            .foregroundStyle(theme.colors.textSecondary.opacity(0.26))
                            .offset(x: 80, y: -20)
                    )

                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.dmUI(30, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)
                    Text(subtitle)
                        .font(.dmUI(14))
                        .foregroundStyle(theme.colors.textSecondary)
                }
                .padding(18)
            }
            .frame(height: height)
            .offset(y: minY > 0 ? -minY : 0)
            .overlay(
                LinearGradient(
                    colors: [.clear, theme.colors.background],
                    startPoint: .center,
                    endPoint: .bottom
                )
            )
            .clipped()
        }
        .frame(height: 250)
    }
}
