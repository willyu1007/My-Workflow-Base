import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { SceneNav } from "../src/components/scene.js";

const route = vi.hoisted(() => ({ pathname: "/workspace" }));
vi.mock("next/navigation.js", () => ({ usePathname: () => route.pathname }));
beforeEach(() => { route.pathname = "/workspace"; });

const items = [
  { href: "/workspace?item=one&view=overview", label: "Overview" },
  { href: "/workspace?item=one&view=records", label: "Records", count: 3 },
];

it("selects the explicit query route and retains each full navigation href", () => {
  render(<SceneNav items={items} activeHref={items[1]!.href} ariaLabel="Views" />);

  expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Records3");
  expect(screen.getByRole("link", { name: "Overview" }).getAttribute("href")).toBe(items[0]!.href);
  expect(screen.getByRole("link", { name: "Records3" }).getAttribute("href")).toBe(items[1]!.href);
});

it("keeps pathname and descendant matching when no active href is supplied", () => {
  route.pathname = "/workspace/detail";
  render(<SceneNav items={[{ href: "/workspace", label: "Workspace" }, { href: "/other", label: "Other" }]} />);

  expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Workspace");
});

it("keeps link focus and native keyboard activation while the controlled view changes", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<SceneNav items={items} activeHref={items[0]!.href} appearance="navy" />);
  const records = screen.getByRole("link", { name: "Records3" });
  const navigate = vi.fn();
  records.addEventListener("click", event => { event.preventDefault(); navigate(records.getAttribute("href")); }, { once: true });

  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(records);
  rerender(<SceneNav items={items} activeHref={items[1]!.href} appearance="navy" />);
  expect(document.activeElement).toBe(records);
  expect(screen.getByRole("link", { current: "page" })).toBe(records);
  await user.keyboard("{Enter}");
  expect(navigate).toHaveBeenCalledExactlyOnceWith("/workspace?item=one&view=records");
});

it("allows an explicit unmatched or empty href without falling back to the pathname", () => {
  const routeItems = [{ href: "/workspace", label: "Workspace" }];
  const { rerender } = render(<SceneNav items={routeItems} activeHref="/missing" />);
  expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);

  rerender(<SceneNav items={routeItems} activeHref="" />);
  expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);

  rerender(<SceneNav items={routeItems} />);
  expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Workspace");
});
