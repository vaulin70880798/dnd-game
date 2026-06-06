import SwiftUI

struct FantasyBackground: View {
    @EnvironmentObject private var theme: ThemeManager

    var body: some View {
        ZStack {
            theme.colors.background

            RadialGradient(
                colors: [theme.colors.accent.opacity(0.13), .clear],
                center: .topLeading,
                startRadius: 20,
                endRadius: 280
            )
            .offset(x: -40, y: -60)

            RadialGradient(
                colors: [Color(hex: "#3A4659").opacity(0.18), .clear],
                center: .bottomTrailing,
                startRadius: 10,
                endRadius: 300
            )
            .offset(x: 60, y: 80)

            LinearGradient(
                colors: [
                    .white.opacity(0.015),
                    .clear,
                    .white.opacity(0.01)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .blendMode(.softLight)
        }
        .ignoresSafeArea()
    }
}
