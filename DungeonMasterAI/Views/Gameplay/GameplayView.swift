import SwiftData
import SwiftUI

struct GameplayView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore
    @Environment(\.dismiss) private var dismiss

    @StateObject private var viewModel: GameplayViewModel

    init(campaign: Campaign, modelContext: ModelContext, keyStore: APIKeyStore) {
        _viewModel = StateObject(
            wrappedValue: GameplayViewModel(
                campaign: campaign,
                modelContext: modelContext,
                keyStore: keyStore
            )
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar
            content
            composerBar
        }
        .background(theme.colors.background.ignoresSafeArea())
        .overlay(alignment: .top) {
            if let status = viewModel.statusMessage {
                ToastView(message: status)
                    .padding(.top, 12)
            }
        }
    }

    private var topBar: some View {
        VStack(spacing: 10) {
            HStack {
                Button {
                    appState.activeCampaign = nil
                    dismiss()
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.dmUI(18, weight: .semibold))
                }
                .tint(theme.colors.textPrimary)

                Spacer()

                VStack(spacing: 2) {
                    Text(viewModel.campaign.heroName)
                        .font(.dmUI(14, weight: .medium))
                        .foregroundStyle(theme.colors.textSecondary)
                    Text("Chapter \(viewModel.campaign.chapter)")
                        .font(.dmUI(12))
                        .foregroundStyle(theme.colors.textSecondary.opacity(0.82))
                }
            }

            CustomSegmentedControl(selection: $viewModel.segment)
        }
        .padding(.horizontal, 14)
        .padding(.top, 12)
        .padding(.bottom, 10)
        .background(theme.colors.background.opacity(0.98))
    }

    @ViewBuilder
    private var content: some View {
        Group {
            if viewModel.segment == .adventure {
                GameLogView(
                    campaign: viewModel.campaign,
                    messages: viewModel.orderedMessages
                )
            } else {
                EngineTuningPanel(viewModel: viewModel)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var composerBar: some View {
        VStack(spacing: 8) {
            if !keyStore.isUnlocked {
                Text("OpenAI API key is required. Configure it in Settings or enable temporary Demo Mode.")
                    .font(.dmUI(13))
                    .foregroundStyle(theme.colors.textSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            HStack(spacing: 8) {
                TextField("Type your action...", text: $viewModel.composerText, axis: .vertical)
                    .lineLimit(1...3)
                    .font(.dmUI(16, weight: .medium))
                    .disabled(!viewModel.isInteractionEnabled)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(theme.colors.surface.opacity(0.82))
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(theme.colors.border.opacity(0.6), lineWidth: 0.5)
                    )

                Button {
                    viewModel.sendRollResult()
                } label: {
                    D20Icon(size: 42)
                        .frame(width: 46, height: 46)
                }
                .buttonStyle(.plain)
                .disabled(!viewModel.isInteractionEnabled)

                Button {
                    viewModel.sendComposerText()
                } label: {
                    Image(systemName: "paperplane")
                        .font(.dmUI(18, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)
                        .frame(width: 44, height: 44)
                        .background(theme.colors.surface.opacity(0.86))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(theme.colors.border.opacity(0.8), lineWidth: 0.5)
                        )
                }
                .buttonStyle(.plain)
                .disabled(!viewModel.isInteractionEnabled || viewModel.composerText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(.horizontal, 12)
        .padding(.top, 8)
        .padding(.bottom, 14)
        .background(
            LinearGradient(
                colors: [theme.colors.background.opacity(0.95), theme.colors.background],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
}

private struct EngineTuningPanel: View {
    @EnvironmentObject private var theme: ThemeManager
    @ObservedObject var viewModel: GameplayViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("AI Fine-Tuning")
                    .font(.dmUI(36, weight: .bold))
                    .foregroundStyle(theme.colors.textPrimary)

                VStack(alignment: .leading, spacing: 16) {
                    Text("AI Engine Settings")
                        .font(.dmUI(23, weight: .semibold))
                        .foregroundStyle(theme.colors.textPrimary)

                    sliderRow(
                        title: "Temperature (Creativity)",
                        value: viewModel.engineSettings.temperature,
                        range: 0...1.4,
                        step: 0.1
                    ) { viewModel.engineSettings.temperature = $0 }

                    sliderRow(
                        title: "Response Length",
                        value: viewModel.engineSettings.maxCharacters,
                        range: 80...650,
                        step: 10
                    ) { viewModel.engineSettings.maxCharacters = $0 }

                    sliderRow(
                        title: "Top P (Nucleus)",
                        value: viewModel.engineSettings.topP,
                        range: 0.1...1.0,
                        step: 0.05
                    ) { viewModel.engineSettings.topP = $0 }

                    sliderRow(
                        title: "Top K",
                        value: viewModel.engineSettings.topK,
                        range: 1...80,
                        step: 1
                    ) { viewModel.engineSettings.topK = $0 }

                    Button("Apply Changes") {
                        viewModel.applyEngineSettings()
                    }
                    .buttonStyle(EmberPrimaryButtonStyle())

                    Button("Reset to Defaults") {
                        viewModel.resetEngineSettings()
                    }
                    .buttonStyle(EmberSecondaryButtonStyle())
                    .frame(maxWidth: .infinity)
                }
                .emberCardStyle()
            }
            .padding(18)
            .padding(.bottom, 30)
        }
    }

    @ViewBuilder
    private func sliderRow(
        title: String,
        value: Double,
        range: ClosedRange<Double>,
        step: Double,
        onChange: @escaping (Double) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(title)
                    .font(.dmUI(15))
                    .foregroundStyle(theme.colors.textPrimary)
                Spacer()
                if title == "Response Length" {
                    Text("\(Int(value)) chars")
                        .font(.dmUI(14, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)
                } else {
                    Text(String(format: "%.2g", value))
                        .font(.dmUI(14, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)
                }
            }

            Slider(
                value: Binding(
                    get: { value },
                    set: { onChange($0) }
                ),
                in: range,
                step: step
            )
            .tint(theme.colors.accent)
        }
    }
}
