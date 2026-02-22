import Foundation

#if canImport(UIKit)
import UIKit
#endif

enum HapticsManager {
    static func diceRoll() {
#if canImport(UIKit)
        let impact = UIImpactFeedbackGenerator(style: .rigid)
        impact.prepare()
        impact.impactOccurred()
#endif
    }

    static func aiArrival() {
#if canImport(UIKit)
        let impact = UIImpactFeedbackGenerator(style: .soft)
        impact.prepare()
        impact.impactOccurred()
#endif
    }
}
