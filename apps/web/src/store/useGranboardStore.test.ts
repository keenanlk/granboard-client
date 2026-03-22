import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGranboardStore } from "./useGranboardStore.ts";

vi.mock("../board/Granboard.ts", () => {
  const mockBoard = { setSegmentHitCallback: vi.fn(), sendCommand: vi.fn() };
  return {
    Granboard: {
      ConnectToBoard: vi.fn(() => Promise.resolve(mockBoard)),
      TryAutoReconnect: vi.fn(() => Promise.resolve(mockBoard)),
    },
  };
});
vi.mock("../board/MockGranboard.ts", () => ({
  MockGranboard: vi.fn(function (this: Record<string, unknown>) {
    this.setSegmentHitCallback = vi.fn();
    this.sendCommand = vi.fn();
  }),
}));
vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

const { Granboard } = await import("../board/Granboard.ts");

beforeEach(() => {
  useGranboardStore.setState({
    board: null,
    status: "disconnected",
    errorMessage: null,
  });
  vi.clearAllMocks();
});

describe("useGranboardStore", () => {
  it("has correct initial state", () => {
    const { board, status, errorMessage } = useGranboardStore.getState();
    expect(board).toBeNull();
    expect(status).toBe("disconnected");
    expect(errorMessage).toBeNull();
  });

  it("connect() sets status to connecting then connected", async () => {
    const promise = useGranboardStore.getState().connect();
    expect(useGranboardStore.getState().status).toBe("connecting");
    await promise;
    expect(useGranboardStore.getState().status).toBe("connected");
    expect(useGranboardStore.getState().board).not.toBeNull();
  });

  it("connect() is a no-op when already connecting", async () => {
    useGranboardStore.setState({ status: "connecting" });
    await useGranboardStore.getState().connect();
    expect(Granboard.ConnectToBoard).not.toHaveBeenCalled();
  });

  it("connect() is a no-op when already connected", async () => {
    useGranboardStore.setState({ status: "connected" });
    await useGranboardStore.getState().connect();
    expect(Granboard.ConnectToBoard).not.toHaveBeenCalled();
  });

  it("connect() sets status to error and errorMessage on failure", async () => {
    vi.mocked(Granboard.ConnectToBoard).mockRejectedValueOnce(
      new Error("BLE unavailable"),
    );
    await useGranboardStore.getState().connect();
    expect(useGranboardStore.getState().status).toBe("error");
    expect(useGranboardStore.getState().errorMessage).toBe("BLE unavailable");
  });

  it("autoReconnect() sets connected on success", async () => {
    await useGranboardStore.getState().autoReconnect();
    expect(useGranboardStore.getState().status).toBe("connected");
    expect(useGranboardStore.getState().board).not.toBeNull();
  });

  it("autoReconnect() is a no-op when already connected", async () => {
    useGranboardStore.setState({ status: "connected" });
    await useGranboardStore.getState().autoReconnect();
    expect(Granboard.TryAutoReconnect).not.toHaveBeenCalled();
  });

  it("autoReconnect() reverts to disconnected on failure (not error)", async () => {
    vi.mocked(Granboard.TryAutoReconnect).mockRejectedValueOnce(
      new Error("no device"),
    );
    await useGranboardStore.getState().autoReconnect();
    expect(useGranboardStore.getState().status).toBe("disconnected");
    expect(useGranboardStore.getState().errorMessage).toBeNull();
  });

  it("disconnect() clears board and sets disconnected", () => {
    useGranboardStore.setState({
      board: { setSegmentHitCallback: vi.fn(), sendCommand: vi.fn() } as never,
      status: "connected",
      errorMessage: "stale",
    });
    useGranboardStore.getState().disconnect();
    expect(useGranboardStore.getState().board).toBeNull();
    expect(useGranboardStore.getState().status).toBe("disconnected");
    expect(useGranboardStore.getState().errorMessage).toBeNull();
  });

  it("connectMock() sets a MockGranboard instance and status connected", () => {
    useGranboardStore.getState().connectMock();
    expect(useGranboardStore.getState().board).not.toBeNull();
    expect(useGranboardStore.getState().status).toBe("connected");
  });
});
