import Foundation

@MainActor
final class APIKeyStore: ObservableObject {
    @Published private(set) var hasAPIKey: Bool = false
    @Published private(set) var maskedPreview: String = ""
    @Published var errorMessage: String?

    private(set) var rawKey: String?

    init() {
        load()
    }

    func load() {
        rawKey = KeychainService.fetchAPIKey()
        hasAPIKey = !(rawKey?.isEmpty ?? true)
        maskedPreview = Self.masked(rawKey)
    }

    func save(_ key: String) {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            errorMessage = "API key cannot be empty."
            return
        }

        do {
            try KeychainService.saveAPIKey(trimmed)
            rawKey = trimmed
            hasAPIKey = true
            maskedPreview = Self.masked(trimmed)
            errorMessage = nil
        } catch {
            errorMessage = "Failed to save key to Keychain."
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
            errorMessage = "Failed to clear key from Keychain."
        }
    }

    static func masked(_ key: String?) -> String {
        guard let key, key.count > 8 else { return "" }
        let prefix = key.prefix(4)
        let suffix = key.suffix(4)
        return "\(prefix)••••••\(suffix)"
    }
}
