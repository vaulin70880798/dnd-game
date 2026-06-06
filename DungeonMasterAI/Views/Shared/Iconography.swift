import SwiftUI

struct D20Shape: Shape {
    func path(in rect: CGRect) -> Path {
        let cx = rect.midX
        let cy = rect.midY
        let radius = min(rect.width, rect.height) / 2.05

        var path = Path()
        let points = (0..<10).map { index -> CGPoint in
            let angle = CGFloat(index) * (.pi * 2 / 10) - .pi / 2
            let r = index.isMultiple(of: 2) ? radius : radius * 0.55
            return CGPoint(x: cx + cos(angle) * r, y: cy + sin(angle) * r)
        }

        guard let first = points.first else { return path }
        path.move(to: first)
        for point in points.dropFirst() {
            path.addLine(to: point)
        }
        path.closeSubpath()

        path.move(to: CGPoint(x: cx, y: cy - radius * 0.96))
        path.addLine(to: CGPoint(x: cx, y: cy + radius * 0.96))
        path.move(to: CGPoint(x: cx - radius * 0.84, y: cy - radius * 0.26))
        path.addLine(to: CGPoint(x: cx + radius * 0.84, y: cy - radius * 0.26))
        path.move(to: CGPoint(x: cx - radius * 0.72, y: cy + radius * 0.44))
        path.addLine(to: CGPoint(x: cx + radius * 0.72, y: cy + radius * 0.44))

        return path
    }
}

struct D20Icon: View {
    @EnvironmentObject private var theme: ThemeManager
    var size: CGFloat = 48

    var body: some View {
        ZStack {
            D20Shape()
                .stroke(theme.colors.accent, lineWidth: 2)
                .frame(width: size, height: size)
                .shadow(color: theme.colors.accent.opacity(0.7), radius: 12, x: 0, y: 0)
            Text("20")
                .font(.dmUI(size * 0.28, weight: .bold))
                .foregroundStyle(theme.colors.accent)
        }
    }
}

struct DragonLogoView: View {
    @EnvironmentObject private var theme: ThemeManager
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            theme.colors.accent.opacity(0.5),
                            .clear
                        ],
                        center: .center,
                        startRadius: 10,
                        endRadius: 120
                    )
                )
                .frame(width: 200, height: 200)

            Image(systemName: "flame.fill")
                .font(.system(size: 92, weight: .semibold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(hex: "#FFD266"), theme.colors.accent],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .shadow(color: theme.colors.accent.opacity(0.6), radius: 18, x: 0, y: 0)
                .rotationEffect(.degrees(16))
        }
    }
}
