import SwiftUI

struct CustomSegmentedControl: View {
    @EnvironmentObject private var theme: ThemeManager
    @Binding var selection: GameplaySegment

    var body: some View {
        HStack(spacing: 0) {
            ForEach(GameplaySegment.allCases) { segment in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selection = segment
                    }
                } label: {
                    Text(segment.rawValue)
                        .font(.dmUI(16, weight: .medium))
                        .foregroundStyle(segment == selection ? Color.black.opacity(0.8) : theme.colors.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(
                            Group {
                                if segment == selection {
                                    LinearGradient(
                                        colors: [theme.colors.accent.opacity(0.92), Color(hex: "#FFD877").opacity(0.9)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                } else {
                                    Color.clear
                                }
                            }
                        )
                }
            }
        }
        .padding(3)
        .background(theme.colors.surface.opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: theme.metrics.capsuleCornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: theme.metrics.capsuleCornerRadius)
                .stroke(theme.colors.border, lineWidth: 0.5)
        )
        .shadow(color: theme.colors.accent.opacity(0.22), radius: 8, x: 0, y: 0)
    }
}
