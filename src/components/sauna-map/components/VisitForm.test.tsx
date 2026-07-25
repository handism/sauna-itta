import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitFormView } from "./VisitForm";
import { VisitFormState } from "../types";

describe("VisitFormView", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultForm: VisitFormState = {
    status: "visited",
    name: "テストサウナ",
    area: "東京",
    date: "2026-07-25",
    rating: 5,
    tagsText: "サウナ,水風呂",
    comment: "良かったです",
    image: "",
    appendHistory: true,
  };

  const defaultProps = {
    form: defaultForm,
    setForm: vi.fn(),
    selectedLocation: { lat: 35.68, lng: 139.76 },
    editingId: "sauna-1",
    historyEntries: [],
    onSubmit: vi.fn(),
    onImageFile: vi.fn(),
    onRemoveImage: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
    imageUploading: false,
  };

  it("renders the append history checkbox with checkbox-row class when editing a visited sauna", () => {
    render(<VisitFormView {...defaultProps} />);

    const labelElement = screen.getByText(/新しい訪問記録として追加する/).closest("label");
    expect(labelElement).not.toBeNull();
    expect(labelElement).toHaveClass("checkbox-row");

    const checkbox = screen.getByRole("checkbox", {
      name: /新しい訪問記録として追加する/,
    });
    expect(checkbox).toBeChecked();
  });

  it("calls setForm when toggling the append history checkbox", () => {
    const setFormMock = vi.fn();
    render(<VisitFormView {...defaultProps} setForm={setFormMock} />);

    const checkbox = screen.getByRole("checkbox", {
      name: /新しい訪問記録として追加する/,
    });
    fireEvent.click(checkbox);

    expect(setFormMock).toHaveBeenCalled();
  });
});
