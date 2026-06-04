import SwiftUI

struct ContentView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text(AppInfo.title)
        .font(.system(size: 28, weight: .bold))

      Text(AppInfo.subtitle)
        .font(.system(size: 14, weight: .medium))
        .foregroundStyle(.secondary)

      Text("Definiere jetzt das erste Feature in features/ und entscheide frueh ueber Sandbox, Signierung und Datenschutz.")
        .font(.system(size: 15))
        .foregroundStyle(.secondary)
    }
    .padding(32)
    .frame(minWidth: 640, minHeight: 360)
  }
}

#Preview {
  ContentView()
}
