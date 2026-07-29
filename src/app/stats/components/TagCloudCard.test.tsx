import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { expect, test, describe, afterEach } from "vitest";
import { TagCloudCard } from "./TagCloudCard";
import { SaunaVisit } from "@/components/sauna-map/types";

describe("TagCloudCard", () => {
  afterEach(() => {
    cleanup();
  });

  const mockVisit = (
    tags: string[],
    status: "visited" | "wishlist" = "visited"
  ): SaunaVisit => ({
    id: Math.random().toString(),
    name: "Test Sauna",
    lat: 35,
    lng: 139,
    comment: "",
    date: "2024-01-01",
    tags,
    status,
  });

  test("renders null when no visits have tags", () => {
    const { container } = render(<TagCloudCard visits={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders tags with correct counts and popular styling", () => {
    const visits = [
      mockVisit(["ロウリュ", "水風呂", "外気浴"]),
      mockVisit(["ロウリュ", "外気浴", "アメニティ"]),
      mockVisit(["ロウリュ", "外気浴", "サ飯"]),
      mockVisit(["ロウリュ", "外気浴", "コスパ"]),
      mockVisit(["ロウリュ"]),
      mockVisit(["外気浴"]),
    ];
    // ロウリュ: 5, 外気浴: 5, 水風呂: 1, アメニティ: 1, サ飯: 1, コスパ: 1
    // maxCount = 5. threshold = ceil(5 * 0.6) = 3

    render(<TagCloudCard visits={visits} />);

    // Total 6 unique tags
    expect(screen.getByText("全 6 種類")).toBeInTheDocument();

    const roryuLink = screen.getByRole("link", { name: /#ロウリュ 5/ });
    expect(roryuLink).toHaveAttribute(
      "href",
      "/?tag=%E3%83%AD%E3%82%A6%E3%83%AA%E3%83%A5"
    );
    expect(roryuLink.className).toMatch(/tagPillPopular/);

    const mizuLink = screen.getByRole("link", { name: /#水風呂 1/ });
    expect(mizuLink).toHaveAttribute(
      "href",
      "/?tag=%E6%B0%B4%E9%A2%A8%E5%91%82"
    );
    expect(mizuLink.className).not.toMatch(/tagPillPopular/);
  });

  test("excludes wishlist visits", () => {
    const visits = [
      mockVisit(["ロウリュ"], "visited"),
      mockVisit(["ロウリュ", "アウフグース"], "wishlist"),
    ];

    render(<TagCloudCard visits={visits} />);
    expect(screen.getByText("全 1 種類")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("#ロウリュ 1");
  });
});
