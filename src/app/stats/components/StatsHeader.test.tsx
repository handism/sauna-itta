import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { StatsHeader } from './StatsHeader';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="mock-next-link">{children}</a>
  )
}));

describe('StatsHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('ヘッダータイトルとサブタイトルが正しく表示されること', () => {
    render(<StatsHeader />);
    expect(screen.getByText('Sauna Itta Analytics')).toBeInTheDocument();
    expect(screen.getByText('統計ダッシュボード')).toBeInTheDocument();
  });

  it('既定でマップへの戻るリンクが表示されること', () => {
    render(<StatsHeader />);
    expect(screen.getByText('マップに戻る')).toBeInTheDocument();
    const link = screen.getByTestId('mock-next-link');
    expect(link).toHaveAttribute('href', '/');
  });

  it('showBackLink が false の場合、戻るリンクおよびテーマ切り替えボタンが表示されないこと', () => {
    render(<StatsHeader showBackLink={false} theme="dark" onToggleTheme={vi.fn()} />);
    expect(screen.queryByText('マップに戻る')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('theme と onToggleTheme が渡された場合、テーマ切り替えボタンが表示されクリック時にコールバックが呼ばれること', () => {
    const onToggleTheme = vi.fn();
    render(<StatsHeader theme="light" onToggleTheme={onToggleTheme} />);

    const toggleButton = screen.getByRole('button', { name: 'ダークモードに切り替え' });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('dark テーマ時はライトモード切り替えのラベルが表示されること', () => {
    render(<StatsHeader theme="dark" onToggleTheme={vi.fn()} />);

    const toggleButton = screen.getByRole('button', { name: 'ライトモードに切り替え' });
    expect(toggleButton).toBeInTheDocument();
  });

  it('onToggleTheme が渡されない場合、テーマ切り替えボタンが表示されないこと', () => {
    render(<StatsHeader theme="dark" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

