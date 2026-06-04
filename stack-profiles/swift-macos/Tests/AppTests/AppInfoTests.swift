import XCTest
@testable import App

final class AppInfoTests: XCTestCase {
  func testTitleIsConfigured() {
    XCTAssertFalse(AppInfo.title.isEmpty)
  }
}
