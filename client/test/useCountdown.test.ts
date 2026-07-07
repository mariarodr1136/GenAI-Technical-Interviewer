import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "../src/hooks/useCountdown.ts";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down once per second", () => {
    const { result } = renderHook(() => useCountdown(() => {}));
    act(() => result.current.start(1));
    expect(result.current.secondsLeft).toBe(60);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(57);
  });

  it("fires onExpire and resets when time runs out", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(onExpire));
    act(() => result.current.start(1));
    act(() => vi.advanceTimersByTime(60_000));
    expect(onExpire).toHaveBeenCalledOnce();
    expect(result.current.secondsLeft).toBe(0);
  });

  it("stop cancels the timer", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(onExpire));
    act(() => result.current.start(1));
    act(() => result.current.stop());
    act(() => vi.advanceTimersByTime(120_000));
    expect(onExpire).not.toHaveBeenCalled();
    expect(result.current.secondsLeft).toBe(0);
  });
});
