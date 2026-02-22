import SwiftData
import SwiftUI

struct SetupWizardView: View {
    @EnvironmentObject private var theme: ThemeManager
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var keyStore: APIKeyStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let onCampaignReady: (Campaign) -> Void
    private let openAIService = OpenAIService()

    @State private var step = 0
    @State private var heroName = ""
    @State private var classBackground = "Ranger / Outlander"
    @State private var style = "Gritty"
    @State private var genre = "Gothic Horror"
    @State private var title = ""
    @State private var isGenerating = false
    @State private var localMessage: String?

    private let classOptions = [
        "Ranger / Outlander",
        "Paladin / Oathbound",
        "Mage / Scholar",
        "Rogue / Spy",
        "Cleric / Pilgrim"
    ]
    private let genres = ["Gothic Horror", "High Fantasy", "Cyberpunk", "Mythic Seas"]
    private let styleOptions = ["Gritty", "Heroic", "Chaotic"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Create Your Hero")
                        .font(.dmUI(38, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)

                    stepHeader

                    Group {
                        switch step {
                        case 0:
                            heroStep
                        case 1:
                            classStep
                        default:
                            styleStep
                        }
                    }
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                    .padding(14)
                    .emberCardStyle()

                    navigationControls
                }
                .padding(18)
                .padding(.bottom, 28)
            }
            .background(theme.colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "arrow.left")
                    }
                    .tint(theme.colors.textPrimary)
                }
            }
            .overlay(alignment: .bottom) {
                if let localMessage {
                    ToastView(message: localMessage)
                        .padding(.bottom, 14)
                        .onAppear {
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) {
                                withAnimation { self.localMessage = nil }
                            }
                        }
                }
            }
        }
    }

    private var stepHeader: some View {
        HStack(spacing: 9) {
            ForEach(0..<3, id: \.self) { index in
                RoundedRectangle(cornerRadius: 999)
                    .fill(index <= step ? theme.colors.accent : theme.colors.surface)
                    .frame(height: 6)
            }
        }
    }

    private var heroStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Step 1 • Identity")
                .font(.dmUI(18, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)

            VStack(alignment: .leading, spacing: 8) {
                Text("Character Name")
                    .font(.dmUI(14))
                    .foregroundStyle(theme.colors.textSecondary)

                HStack(spacing: 8) {
                    TextField("e.g. Elara Vance", text: $heroName)
                        .font(.dmUI(16))
                        .foregroundStyle(theme.colors.textPrimary)
                        .padding(12)
                        .background(theme.colors.background.opacity(0.8))
                        .clipShape(RoundedRectangle(cornerRadius: 11))
                        .overlay(
                            RoundedRectangle(cornerRadius: 11)
                                .stroke(theme.colors.border.opacity(0.45), lineWidth: 0.5)
                        )

                    Button {
                        Task { await autofillWithAI() }
                    } label: {
                        Group {
                            if isGenerating {
                                ProgressView()
                                    .tint(theme.colors.accent)
                            } else {
                                Image(systemName: "wand.and.stars")
                                    .font(.dmUI(18, weight: .semibold))
                            }
                        }
                        .frame(width: 44, height: 44)
                    }
                    .buttonStyle(EmberSecondaryButtonStyle())
                    .disabled(isGenerating)
                }
            }
        }
    }

    private var classStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Step 2 • Origins")
                .font(.dmUI(18, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)

            VStack(alignment: .leading, spacing: 8) {
                Text("Class & Background")
                    .font(.dmUI(14))
                    .foregroundStyle(theme.colors.textSecondary)

                Menu {
                    ForEach(classOptions, id: \.self) { option in
                        Button(option) { classBackground = option }
                    }
                } label: {
                    selectionCapsule(classBackground)
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Realm Genre")
                    .font(.dmUI(14))
                    .foregroundStyle(theme.colors.textSecondary)

                Menu {
                    ForEach(genres, id: \.self) { option in
                        Button(option) { genre = option }
                    }
                } label: {
                    selectionCapsule(genre)
                }
            }
        }
    }

    private var styleStep: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Step 3 • Tone")
                .font(.dmUI(18, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)

            Text("Choose Your Style")
                .font(.dmUI(26, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(styleOptions, id: \.self) { option in
                        Button {
                            style = option
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color(hex: "#2F3642"), Color(hex: "#15171F")],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(height: 106)
                                    .overlay(
                                        Image(systemName: optionSymbol(for: option))
                                            .font(.system(size: 36))
                                            .foregroundStyle(theme.colors.textSecondary.opacity(0.55))
                                    )

                                Text(option)
                                    .font(.dmUI(18, weight: .semibold))
                                    .foregroundStyle(theme.colors.textPrimary)
                            }
                            .frame(width: 138)
                            .padding(10)
                            .background(theme.colors.surface.opacity(0.92))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(
                                        option == style ? theme.colors.accent : theme.colors.border.opacity(0.4),
                                        lineWidth: option == style ? 1 : 0.5
                                    )
                            )
                            .shadow(color: theme.colors.accent.opacity(option == style ? 0.36 : 0.12), radius: 8)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var navigationControls: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                if step > 0 {
                    Button("Back") {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            step -= 1
                        }
                    }
                        .buttonStyle(EmberSecondaryButtonStyle())
                }

                if step < 2 {
                    Button("Continue") {
                        withAnimation(.easeInOut(duration: 0.25)) {
                            step += 1
                        }
                    }
                        .buttonStyle(EmberSecondaryButtonStyle())
                } else {
                    Button("Begin Adventure") {
                        beginAdventure()
                    }
                    .buttonStyle(EmberPrimaryButtonStyle())
                    .disabled(!canBeginAdventure)
                }
            }

            if !keyStore.isUnlocked {
                Text("OpenAI key is required before starting, unless temporary Demo Mode is enabled in Settings.")
                    .font(.dmUI(13))
                    .foregroundStyle(theme.colors.textSecondary)
            }
        }
    }

    private var canBeginAdventure: Bool {
        keyStore.isUnlocked && !heroName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    @ViewBuilder
    private func selectionCapsule(_ value: String) -> some View {
        HStack {
            Text(value)
                .font(.dmUI(16))
            Spacer()
            Image(systemName: "chevron.down")
                .font(.dmUI(14, weight: .semibold))
        }
        .foregroundStyle(theme.colors.textPrimary)
        .padding(12)
        .background(theme.colors.background.opacity(0.8))
        .clipShape(RoundedRectangle(cornerRadius: 11))
        .overlay(
            RoundedRectangle(cornerRadius: 11)
                .stroke(theme.colors.border.opacity(0.45), lineWidth: 0.5)
        )
    }

    private func optionSymbol(for option: String) -> String {
        switch option {
        case "Heroic":
            return "shield.lefthalf.filled"
        case "Chaotic":
            return "moon.stars.fill"
        default:
            return "figure.sword"
        }
    }

    private func beginAdventure() {
        appState.requireAPIKey(using: keyStore) {
            let resolvedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ? "\(genre) - Session 1"
                : title

            let campaign = Campaign(
                title: resolvedTitle,
                genre: genre,
                heroName: heroName,
                classBackground: classBackground,
                narrativeStyle: style,
                chapter: 1,
                summary: "Your journey begins in the embers of a forgotten realm."
            )

            let intro = CampaignMessage(
                role: .assistant,
                text: "The night descends as \(heroName) steps into a realm of ash and prophecy. What do you do first?",
                campaign: campaign
            )
            campaign.messages.append(intro)

            modelContext.insert(campaign)
            do {
                try modelContext.save()
                onCampaignReady(campaign)
                dismiss()
            } catch {
                localMessage = "Failed to create campaign. Try again."
            }
        }
    }

    private func autofillWithAI() async {
        isGenerating = true
        defer { isGenerating = false }

        if keyStore.demoModeEnabled, (keyStore.rawKey?.isEmpty ?? true) {
            let names = ["Elara Vance", "Kael Draven", "Nyra Hollow", "Thorn Vale", "Seren Ash"]
            heroName = names.randomElement() ?? "Elara Vance"
            classBackground = classOptions.randomElement() ?? classBackground
            style = styleOptions.randomElement() ?? style
            title = "\(genre) - Session 1"
            localMessage = "Character draft generated from temporary Demo Mode."
            return
        }

        guard let key = keyStore.rawKey else {
            localMessage = "OpenAI API key is missing."
            return
        }

        do {
            let draft = try await openAIService.generateCharacterDraft(apiKey: key)
            heroName = draft.name
            classBackground = draft.classBackground
            style = styleOptions.contains(draft.style) ? draft.style : style
            title = draft.campaignTitle
            localMessage = "Character draft generated."
        } catch {
            localMessage = "Auto-fill failed. Try again."
        }
    }
}
