import { describe, expect, it } from "vitest";
import { channelForWorkspace } from "../src/services/collaborationService.js";

describe("workspace Redis channel naming", () => {
  it("uses an isolated channel per workspace", () => {
    expect(channelForWorkspace("workspace-1")).toBe("workspace:workspace-1:events");
  });
});
