import Foundation

@MainActor
final class APIKeyStore: ObservableObject {
    private static let demoModeDefaultsKey = "dmai_demo_mode_enabled"

    @Published private(set) var hasAPIKey: Bool = false
    @Published private(set) var demoModeEnabled: Bool = false
    @Published private(set) var maskedPreview: String = ""
    @Published var errorMessage: String?

    private(set) var rawKey: String?

    init() {
        demoModeEnabled = UserDefaults.standard.bool(forKey: Self.demoModeDefaultsKey)
        load()
    }

    var isUnlocked: Bool {
        hasAPIKey || demoModeEnabled
    }

    func load() {
        rawKey = KeychainService.fetchAPIKey()
        hasAPIKey = !(rawKey?.isEmpty ?? true)
        maskedPreview = Self.masked(rawKey)
    }

    func save(_ key: String) {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            errorMessage = "מפתח API לא יכול להיות ריק."
            return
        }

        do {
            try KeychainService.saveAPIKey(trimmed)
            rawKey = trimmed
            hasAPIKey = true
            maskedPreview = Self.masked(trimmed)
            errorMessage = nil
        } catch {
            errorMessage = "שמירת המפתח ב‑Keychain נכשלה."
        }
    }

    func clear() {
        do {
            try KeychainService.clearAPIKey()
            rawKey = nil
            hasAPIKey = false
            maskedPreview = ""
            errorMessage = nil
        } catch {
            errorMessage = "מחיקת המפתח מ‑Keychain נכשלה."
        }
    }

    func setDemoMode(_ enabled: Bool) {
        demoModeEnabled = enabled
        UserDefaults.standard.set(enabled, forKey: Self.demoModeDefaultsKey)
    }

    func enableDemoModeQuickly() {
        setDemoMode(true)
    }

    static func masked(_ key: String?) -> String {
        guard let key, key.count > 8 else { return "" }
        let prefix = key.prefix(4)
        let suffix = key.suffix(4)
        return "\(prefix)••••••\(suffix)"
    }
}
