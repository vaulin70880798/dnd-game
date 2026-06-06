import SwiftUI

@MainActor
final class ThemeManager: ObservableObject {
    let colors = DMColors()
    let metrics = DMMetrics()
}

struct DMColors {
    let background = Color(hex: "#0A0A0A")
    let surface = Color(hex: "#1C1C1E")
    let accent = Color(hex: "#FF9F0A")
    let textPrimary = Color.white
    let textSecondary = Color.white.opacity(0.64)
    let border = Color(hex: "#FF9F0A").opacity(0.68)
    let glass = Color.white.opacity(0.06)
}

struct DMMetrics {
    let cardCornerRadius: CGFloat = 16
    let capsuleCornerRadius: CGFloat = 14
    let borderWidth: CGFloat = 0.5
}

extension Color {
    init(hex: String) {
        let sanitized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: sanitized).scanHexInt64(&int)
        let a, r, g, b: UInt64

        switch sanitized.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension Font {
    static func dmStory(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .custom("NewYork", size: size).weight(weight)
    }

    static func dmBrand(_ size: CGFloat, weight: Weight = .bold) -> Font {
        .custom("Copperplate-Bold", size: size).weight(weight)
    }

    static func dmUI(_ size: CGFloat, weight: Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }
}
