import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { StatsEmptyState } from './StatsEmptyState';

describe('StatsEmptyState', () => {
  afterEach(() => {
    cleanup();
  });

  it('記録が無いときは登録への導線を出す', () => {
    render(<StatsEmptyState variant="none" />);

    expect(screen.getByRole('region', { name: 'まだ記録がありません' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'マップでサウナを登録する' })).toHaveAttribute('href', '/');
  });

  it('行きたいだけのときは件数と、統計が出るまでの手順を伝える', () => {
    render(<StatsEmptyState variant="wishlistOnly" wishlistCount={3} />);

    expect(
      screen.getByRole('heading', { name: '行ったサウナを記録すると統計が表示されます' })
    ).toBeInTheDocument();
    expect(screen.getByText(/「行きたい」の 3 件は登録済みです/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'マップで記録を開く' })).toHaveAttribute('href', '/');
  });
});
