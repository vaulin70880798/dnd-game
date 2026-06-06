import SwiftData
import SwiftUI

struct CodexView: View {
    @EnvironmentObject private var theme: ThemeManager
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CodexCard.createdAt, order: .reverse) private var cards: [CodexCard]

    @State private var selectedCard: CodexCard?
    @State private var showingAddCard = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            theme.colors.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("קודקס")
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)
                        .padding(.bottom, 8)

                    ForEach(Array(cards.prefix(3)), id: \.id) { card in
                        CodexRowCard(card: card)
                            .onTapGesture { selectedCard = card }
                    }

                    LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: 12) {
                        ForEach(Array(cards.dropFirst(3)), id: \.id) { card in
                            CodexGridCard(card: card)
                                .onTapGesture { selectedCard = card }
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 18)
                .padding(.bottom, 100)
            }

            Button {
                showingAddCard = true
            } label: {
                Image(systemName: "plus")
                    .font(.dmUI(24, weight: .bold))
                    .foregroundStyle(Color.black.opacity(0.84))
                    .frame(width: 56, height: 56)
                    .background(
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "#FFD877"), theme.colors.accent],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .shadow(color: theme.colors.accent.opacity(0.45), radius: 12, x: 0, y: 0)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 24)
        }
        .navigationBarHidden(true)
        .sheet(item: $selectedCard) { card in
            CodexDetailSheet(card: card)
                .environmentObject(theme)
        }
        .sheet(isPresented: $showingAddCard) {
            AddCodexCardSheet { title, lore, kind in
                let newCard = CodexCard(title: title, lore: lore, kind: kind)
                modelContext.insert(newCard)
                try? modelContext.save()
            }
            .environmentObject(theme)
        }
    }
}

private struct CodexRowCard: View {
    @EnvironmentObject private var theme: ThemeManager
    let card: CodexCard

    var body: some View {
        HStack(spacing: 10) {
            iconBlock

            VStack(alignment: .leading, spacing: 6) {
                Text(card.title)
                    .font(.dmUI(20, weight: .semibold))
                    .foregroundStyle(theme.colors.textPrimary)
                    .lineLimit(1)

                Text(card.lore)
                    .font(.dmUI(14))
                    .foregroundStyle(theme.colors.textSecondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .emberCardStyle()
    }

    private var iconBlock: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(
                LinearGradient(
                    colors: [Color(hex: "#29313B"), Color(hex: "#13171F")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: 60, height: 60)
            .overlay(
                Image(systemName: symbol)
                    .foregroundStyle(theme.colors.textSecondary.opacity(0.7))
                    .font(.system(size: 25))
            )
    }

    private var symbol: String {
        switch card.typedKind {
        case .item: return "diamond.fill"
        case .location: return "map.fill"
        case .faction: return "flag.fill"
        case .npc: return "person.fill"
        }
    }
}

private struct CodexGridCard: View {
    @EnvironmentObject private var theme: ThemeManager
    let card: CodexCard

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            RoundedRectangle(cornerRadius: 10)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "#313A46"), Color(hex: "#11151C")],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(height: 90)
                .overlay(
                    Image(systemName: "book.pages.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(theme.colors.textSecondary.opacity(0.52))
                )

            Text(card.title)
                .font(.dmUI(18, weight: .semibold))
                .foregroundStyle(theme.colors.textPrimary)
                .lineLimit(2)

            Text(card.lore)
                .font(.dmUI(13))
                .foregroundStyle(theme.colors.textSecondary)
                .lineLimit(3)
        }
        .emberCardStyle()
    }
}

private struct CodexDetailSheet: View {
    @EnvironmentObject private var theme: ThemeManager
    @Environment(\.dismiss) private var dismiss
    let card: CodexCard

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(card.title)
                        .font(.dmUI(36, weight: .bold))
                        .foregroundStyle(theme.colors.textPrimary)
                    Text(card.typedKind.rawValue)
                        .font(.dmUI(15, weight: .semibold))
                        .foregroundStyle(theme.colors.accent)

                    Text(card.lore)
                        .font(.dmStory(19))
                        .foregroundStyle(theme.colors.textPrimary)
                        .lineSpacing(5)
                }
                .padding(18)
            }
            .background(theme.colors.background.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("סיום") { dismiss() }
                        .tint(theme.colors.accent)
                }
            }
        }
    }
}

private struct AddCodexCardSheet: View {
    @EnvironmentObject private var theme: ThemeManager
    @Environment(\.dismiss) private var dismiss

    let onSave: (String, String, CodexKind) -> Void
    @State private var title = ""
    @State private var lore = ""
    @State private var kind: CodexKind = .npc

    var body: some View {
        NavigationStack {
            Form {
                TextField("כותרת", text: $title)
                Picker("סוג", selection: $kind) {
                    ForEach(CodexKind.allCases, id: \.self) {
                        Text($0.rawValue).tag($0)
                    }
                }
                TextField("לור/רקע", text: $lore, axis: .vertical)
                    .lineLimit(6...)
            }
            .scrollContentBackground(.hidden)
            .background(theme.colors.background)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("ביטול") { dismiss() }
                        .tint(theme.colors.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("הוספה") {
                        onSave(title, lore, kind)
                        dismiss()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || lore.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .tint(theme.colors.accent)
                }
            }
        }
    }
}

