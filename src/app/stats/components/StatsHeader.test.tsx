import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StatsHeader } from './StatsHeader';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) => (
    <a href={href} className={className} data-testid="mock-next-link">{children}</a>
  )
}));

describe('StatsHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the header title correctly', () => {
    render(<StatsHeader />);
    expect(screen.getByText('Sauna Itta Analytics')).toBeDefined();
    expect(screen.getByText('統計ダッシュボード')).toBeDefined();
  });

  it('renders the back link by default', () => {
    render(<StatsHeader />);
    expect(screen.getByText('マップに戻る')).toBeDefined();
    const link = screen.getByTestId('mock-next-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/');
  });

  it('does not render the back link when showBackLink is false', () => {
    render(<StatsHeader showBackLink={false} />);
    expect(screen.queryByText('マップに戻る')).toBeNull();
  });

  it('renders the theme toggle button when theme and onToggleTheme are provided', () => {
    const onToggleTheme = vi.fn();
    render(<StatsHeader theme="light" onToggleTheme={onToggleTheme} />);

    const toggleButton = screen.getByRole('button', { name: 'ダークモードに切り替え' });
    expect(toggleButton).toBeDefined();

    fireEvent.click(toggleButton);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders correct label for dark theme', () => {
    render(<StatsHeader theme="dark" onToggleTheme={vi.fn()} />);

    const toggleButton = screen.getByRole('button', { name: 'ライトモードに切り替え' });
    expect(toggleButton).toBeDefined();
  });

  it('does not render theme toggle if onToggleTheme is not provided', () => {
    render(<StatsHeader theme="dark" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
