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

  it('47 都道府県を北から南の順に並べ、行った都道府県と未訪問を区別すること', () => {
    const prefectures = ['埼玉県', '東京都', '神奈川県'];
    render(<PrefectureSection prefectures={prefectures} count={3} />);

    expect(screen.getByRole('heading', { name: '都道府県制覇' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: '47都道府県のうち3か所を制覇' });
    const items = Array.from(list.querySelectorAll('li'));
    expect(items).toHaveLength(47);
    expect(items[0]).toHaveTextContent('北海道（未訪問）');
    expect(items[46]).toHaveTextContent('沖縄県（未訪問）');

    prefectures.forEach((pref) => {
      expect(screen.getByTitle(pref)).not.toHaveTextContent('未訪問');
    });
    expect(screen.getByRole('progressbar', { name: '都道府県の制覇率' })).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
  });

  it('一覧に無い名前は行ったものとして末尾に残すこと', () => {
    render(<PrefectureSection prefectures={['東京都', '架空県']} count={2} />);

    const items = Array.from(
      screen.getByRole('list', { name: '47都道府県のうち1か所を制覇' }).querySelectorAll('li'),
    );
    expect(items).toHaveLength(48);
    expect(items[47]).toHaveTextContent('架空県');
  });

  it('日本地図の形に並べる位置を持たせ、地方ごとの制覇数を出すこと', () => {
    render(<PrefectureSection prefectures={['北海道', '東京都', '神奈川県']} count={3} />);

    // 北海道は右上、沖縄は左下のマス
    expect(screen.getByTitle('北海道')).toHaveStyle({ gridColumn: '14', gridRow: '1' });
    expect(screen.getByTitle('沖縄県')).toHaveStyle({ gridColumn: '1', gridRow: '12' });
    // 読み上げは「県」まで含めた名前のまま
    expect(screen.getByTitle('神奈川県')).toHaveTextContent('神奈川県');

    const regions = screen.getByRole('list', { name: '地方ごとの制覇数' });
    const rows = Array.from(regions.querySelectorAll('li'));
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveTextContent('北海道1 / 1');
    expect(rows[2]).toHaveTextContent('関東2 / 7');
  });
});
