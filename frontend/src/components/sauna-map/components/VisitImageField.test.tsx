import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitImageField } from "./VisitImageField";

const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function createFile() {
  return new File(["dummy"], "sauna.png", { type: "image/png" });
}

function getFileInput() {
  return document.getElementById("visit-image") as HTMLInputElement;
}

describe("VisitImageField", () => {
  afterEach(cleanup);

  it("写真が無いときはドロップゾーンを表示する", () => {
    render(<VisitImageField image="" onFile={vi.fn()} onRemove={vi.fn()} />);

    expect(
      screen.getByText("クリックまたはドラッグ&ドロップで写真を追加"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
  });

  it("ファイル選択で onFile を呼び、同じファイルを選び直せるよう値を空にする", () => {
    const onFile = vi.fn();
    render(<VisitImageField image="" onFile={onFile} onRemove={vi.fn()} />);
    const input = getFileInput();
    const file = createFile();

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
    expect(input.value).toBe("");
  });

  it("ドラッグ&ドロップでも onFile を呼ぶ", () => {
    const onFile = vi.fn();
    const { container } = render(<VisitImageField image="" onFile={onFile} onRemove={vi.fn()} />);
    const dropzone = container.querySelector(".image-dropzone") as HTMLElement;
    const file = createFile();

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass("is-dragover");

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
    expect(dropzone).not.toHaveClass("is-dragover");
  });

  it("キーボードからもファイル選択を開ける", () => {
    render(<VisitImageField image="" onFile={vi.fn()} onRemove={vi.fn()} />);
    const dropzone = screen.getByRole("button");
    const click = vi.spyOn(getFileInput(), "click").mockImplementation(() => {});

    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });

    expect(click).toHaveBeenCalledTimes(2);
    click.mockRestore();
  });

  it("圧縮中はドロップゾーンからの選択を無効にし、進行中であることを伝える", () => {
    const onFile = vi.fn();
    const { container } = render(
      <VisitImageField image="" onFile={onFile} onRemove={vi.fn()} uploading />,
    );
    const dropzone = container.querySelector(".image-dropzone") as HTMLElement;
    const click = vi.spyOn(getFileInput(), "click").mockImplementation(() => {});

    expect(screen.getByText("画像を圧縮しています…")).toBeInTheDocument();
    expect(getFileInput()).toBeDisabled();

    fireEvent.click(dropzone);
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.drop(dropzone, { dataTransfer: { files: [createFile()] } });

    expect(click).not.toHaveBeenCalled();
    expect(onFile).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it("写真があるときはプレビューと変更・削除ボタンを表示する", () => {
    const onRemove = vi.fn();
    render(<VisitImageField image={PNG_DATA_URL} onFile={vi.fn()} onRemove={onRemove} />);

    expect(screen.getByRole("img", { name: "アップロードした写真" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /削除/ }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("危険なURLはプレビューせずドロップゾーンを表示する", () => {
    render(<VisitImageField image="javascript:alert(1)" onFile={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.queryByRole("img", { name: "アップロードした写真" })).not.toBeInTheDocument();
    expect(
      screen.getByText("クリックまたはドラッグ&ドロップで写真を追加"),
    ).toBeInTheDocument();
  });
});
