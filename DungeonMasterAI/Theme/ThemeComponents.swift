import SwiftUI

struct EmberCard: ViewModifier {
    private let colors = DMColors()
    private let metrics = DMMetrics()

    func body(content: Content) -> some View {
        content
            .padding(12)
            .background(colors.surface.opacity(0.92))
            .overlay(
                RoundedRectangle(cornerRadius: metrics.cardCornerRadius)
                    .stroke(colors.border, lineWidth: metrics.borderWidth)
            )
            .clipShape(RoundedRectangle(cornerRadius: metrics.cardCornerRadius))
            .shadow(color: colors.accent.opacity(0.25), radius: 7, x: 0, y: 0)
    }
}

struct GlassPanel: ViewModifier {
    private let colors = DMColors()
    private let metrics = DMMetrics()

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial.opacity(0.25))
            .background(colors.glass)
            .clipShape(RoundedRectangle(cornerRadius: metrics.cardCornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: metrics.cardCornerRadius)
                    .stroke(colors.border.opacity(0.5), lineWidth: metrics.borderWidth)
            )
    }
}

struct EmberPrimaryButtonStyle: ButtonStyle {
    private let colors = DMColors()
    private let metrics = DMMetrics()

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.dmUI(16, weight: .semibold))
            .foregroundStyle(Color.black.opacity(0.85))
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity)
            .background(
                LinearGradient(
                    colors: [
                        colors.accent.opacity(configuration.isPressed ? 0.78 : 0.95),
                        Color(hex: "#FFD877").opacity(configuration.isPressed ? 0.75 : 0.92)
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: metrics.capsuleCornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: metrics.capsuleCornerRadius)
                    .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
            )
            .shadow(color: colors.accent.opacity(0.36), radius: 12, x: 0, y: 0)
    }
}

struct EmberSecondaryButtonStyle: ButtonStyle {
    private let colors = DMColors()
    private let metrics = DMMetrics()

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.dmUI(14, weight: .medium))
            .foregroundStyle(colors.textPrimary.opacity(configuration.isPressed ? 0.7 : 0.92))
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(colors.surface.opacity(0.95))
            .clipShape(RoundedRectangle(cornerRadius: metrics.capsuleCornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: metrics.capsuleCornerRadius)
                    .stroke(colors.border.opacity(0.5), lineWidth: 0.5)
            )
    }
}

extension View {
    func emberCardStyle() -> some View {
        modifier(EmberCard())
    }

    func glassPanelStyle() -> some View {
        modifier(GlassPanel())
    }
}
