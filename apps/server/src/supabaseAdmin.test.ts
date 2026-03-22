import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./lib/logger.ts", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

describe("supabaseAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("returns null when env vars are missing", async () => {
    const { supabaseAdmin } = await import("./supabaseAdmin.ts");
    expect(supabaseAdmin).toBeNull();
  });

  it("returns null when only SUPABASE_URL is set", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    const { supabaseAdmin } = await import("./supabaseAdmin.ts");
    expect(supabaseAdmin).toBeNull();
  });

  it("returns a client when both env vars are present", async () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    const { supabaseAdmin } = await import("./supabaseAdmin.ts");
    expect(supabaseAdmin).not.toBeNull();
    expect(supabaseAdmin).toHaveProperty("from");
  });

  it("logs a warning when credentials are missing", async () => {
    const { logger } = await import("./lib/logger.ts");
    await import("./supabaseAdmin.ts");
    expect(logger.warn).toHaveBeenCalled();
  });
});
