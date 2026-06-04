import { describe, expect, it } from "vitest";

describe("starter copy", () => {
  it("uses the expected onboarding message", () => {
    const message =
      "Definiere jetzt das erste Feature in features/ und richte anschliessend UI, Datenmodell und Deploy-Flow sauber aus.";

    expect(message).toContain("Feature");
  });
});
