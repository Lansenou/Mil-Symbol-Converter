// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { SidcConverter, useSidcConverter } from "../src/react";

describe("useSidcConverter", () => {
  it("converts and memoizes on unchanged inputs", () => {
    const { result, rerender } = renderHook(
      ({ s, lossy }) => useSidcConverter(s, { allowLossy: lossy }),
      {
        initialProps: { s: "SFGPUCIC---E---", lossy: false },
      },
    );
    const first = result.current;
    expect(first.output).toBe("10031000151211000002");
    rerender({ s: "SFGPUCIC---E---", lossy: false });
    expect(result.current).toBe(first);
    rerender({ s: "SFGPUCIC---EUS-", lossy: true });
    expect(result.current).not.toBe(first);
    expect(result.current.matchQuality).toBe("lossy");
  });

  it("returns structured errors instead of throwing", () => {
    const { result } = renderHook(() => useSidcConverter("nonsense"));
    expect(result.current.success).toBe(false);
    expect(result.current.diagnostics[0]?.code).toBeDefined();
  });
});

describe("<SidcConverter />", () => {
  it("renders results and updates on input", () => {
    render(<SidcConverter />);
    expect(screen.getByTestId("output").textContent).toBe(
      "10031000151211000002",
    );
    expect(screen.getByTestId("quality").textContent).toBe("exact");
    act(() => {
      fireEvent.change(screen.getByLabelText(/2525C SIDC/), {
        target: { value: "S*GPUCI---*****" },
      });
    });
    expect(screen.getByTestId("quality").textContent).toBe("ambiguous");
    expect(screen.getByText(/needs concrete values/)).toBeTruthy();
  });
});
