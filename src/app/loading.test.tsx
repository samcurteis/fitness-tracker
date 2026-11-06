// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Loading from "./loading";

afterEach(cleanup);

test("renders a loading indicator", () => {
  render(<Loading />);
  expect(screen.getByRole("status").textContent).toBe("Loading…");
});
