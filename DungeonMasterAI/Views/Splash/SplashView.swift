import SwiftUI

struct SplashView: View {
    @EnvironmentObject private var theme: ThemeManager
    @State private var pulsing = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color.black,
                    Color(hex: "#12161F"),
                    Color.black
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                DragonLogoView()
                    .scaleEffect(pulsing ? 1.04 : 0.9)
                    .opacity(pulsing ? 1.0 : 0.82)
                    .shadow(color: theme.colors.accent.opacity(0.5), radius: pulsing ? 18 : 8, x: 0, y: 0)
                    .animation(
                        .easeInOut(duration: 1.2).repeatForever(autoreverses: true),
                        value: pulsing
                    )

                Text("שליט המבוך AI")
                    .font(.dmBrand(38, weight: .bold))
                    .kerning(0.6)
                    .foregroundStyle(theme.colors.textPrimary)
            }
        }
        .onAppear {
            pulsing = true
        }
    }
}
