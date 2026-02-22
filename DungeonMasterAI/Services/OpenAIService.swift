import Foundation

enum OpenAIServiceError: LocalizedError {
    case badResponse
    case missingContent

    var errorDescription: String? {
        switch self {
        case .badResponse:
            return "התקבלה תשובה לא תקינה מ‑OpenAI."
        case .missingContent:
            return "לא התקבל תוכן טקסטואלי מהמודל."
        }
    }
}

struct OpenAIChatMessage: Encodable {
    let role: String
    let content: String
}

struct OpenAIService {
    private let endpoint = URL(string: "https://api.openai.com/v1/chat/completions")!

    func narrate(
        promptHistory: [OpenAIChatMessage],
        settings: AIEngineSettings,
        apiKey: String
    ) async throws -> String {
        let maxTokens = max(64, Int(settings.maxCharacters / 4.0))

        let payload = ChatCompletionRequest(
            model: "gpt-4o-mini",
            messages: promptHistory,
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: maxTokens
        )

        let response = try await callOpenAI(payload: payload, apiKey: apiKey)
        guard let content = response.choices.first?.message.content.trimmingCharacters(in: .whitespacesAndNewlines),
              !content.isEmpty else {
            throw OpenAIServiceError.missingContent
        }
        return content
    }

    func generateCharacterDraft(apiKey: String) async throws -> CharacterDraft {
        let instruction = """
        צור טיוטת דמות למשחק תפקידים בפנטזיה אפלה.
        החזר JSON בלבד במבנה הבא:
        {
          "name": "string בעברית",
          "classBackground": "string בעברית",
          "style": "קשוח|הרואי|כאוטי",
          "campaignTitle": "string בעברית"
        }
        """

        let payload = ChatCompletionRequest(
            model: "gpt-4o-mini",
            messages: [
                OpenAIChatMessage(role: "system", content: "אתה מייצר נתוני פתיחה תמציתיים ל‑RPG בעברית בלבד."),
                OpenAIChatMessage(role: "user", content: instruction)
            ],
            temperature: 0.9,
            topP: 1.0,
            maxTokens: 220
        )

        let response = try await callOpenAI(payload: payload, apiKey: apiKey)
        guard let raw = response.choices.first?.message.content else {
            throw OpenAIServiceError.missingContent
        }

        let objectText = extractJSONObject(from: raw)
        let data = Data(objectText.utf8)
        return try JSONDecoder().decode(CharacterDraft.self, from: data)
    }

    private func callOpenAI(payload: ChatCompletionRequest, apiKey: String) async throws -> ChatCompletionResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw OpenAIServiceError.badResponse
        }
        return try JSONDecoder().decode(ChatCompletionResponse.self, from: data)
    }

    private func extractJSONObject(from text: String) -> String {
        if let start = text.firstIndex(of: "{"),
           let end = text.lastIndex(of: "}") {
            return String(text[start...end])
        }
        return text
    }
}

private struct ChatCompletionRequest: Encodable {
    let model: String
    let messages: [OpenAIChatMessage]
    let temperature: Double

    enum CodingKeys: String, CodingKey {
        case model
        case messages
        case temperature
        case topP = "top_p"
        case maxTokens = "max_tokens"
    }

    let topP: Double
    let maxTokens: Int
}

private struct ChatCompletionResponse: Decodable {
    struct Choice: Decodable {
        struct Message: Decodable {
            let role: String
            let content: String
        }

        let index: Int
        let message: Message
    }

    let choices: [Choice]
}
