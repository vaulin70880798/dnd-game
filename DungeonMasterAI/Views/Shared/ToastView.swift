import SwiftUI

struct ToastView: View {
    @EnvironmentObject private var theme: ThemeManager
    let message: String

    var body: some View {
        Text(message)
            .font(.dmUI(14, weight: .medium))
            .foregroundStyle(theme.colors.textPrimary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(theme.colors.surface.opacity(0.95))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(theme.colors.border.opacity(0.8), lineWidth: 0.5)
            )
            .shadow(color: theme.colors.accent.opacity(0.24), radius: 10, x: 0, y: 0)
    }
}
