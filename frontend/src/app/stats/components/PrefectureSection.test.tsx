import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { PrefectureSection } from './PrefectureSection';

describe('PrefectureSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('count が 0 以下の場合は何も描画しないこと', () => {
    const { container } = render(<PrefectureSection prefectures={[]} count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('count が 1 以上の場合に都道府県リストとタイトルが表示されること', () => {
    const prefectures = ['東京都', '神奈川県', '埼玉県'];
    render(<PrefectureSection prefectures={prefectures} count={3} />);

    expect(screen.getByRole('heading', { name: '都道府県制覇' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '制覇した3都道府県' })).toBeInTheDocument();

    prefectures.forEach((pref) => {
      expect(screen.getByText(pref)).toBeInTheDocument();
    });
  });
});
