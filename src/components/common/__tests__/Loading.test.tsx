import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading, InlineLoading } from '../Loading';

describe('Loading', () => {
  it('should render with default message', () => {
    render(<Loading />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<Loading message="カスタムメッセージ" />);
    expect(screen.getByText('カスタムメッセージ')).toBeInTheDocument();
  });

  it('should render fullscreen loading', () => {
    const { container } = render(<Loading fullScreen />);
    const backdrop = container.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeInTheDocument();
  });

  it('should render with custom size', () => {
    const { container } = render(<Loading size={60} />);
    const progress = container.querySelector('.MuiCircularProgress-root');
    expect(progress).toBeInTheDocument();
  });

  it('should not render message when message is empty', () => {
    render(<Loading message="" />);
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
  });
});

describe('InlineLoading', () => {
  it('should render inline loading spinner', () => {
    const { container } = render(<InlineLoading />);
    const progress = container.querySelector('.MuiCircularProgress-root');
    expect(progress).toBeInTheDocument();
  });

  it('should render with custom size', () => {
    const { container } = render(<InlineLoading size={30} />);
    const progress = container.querySelector('.MuiCircularProgress-root');
    expect(progress).toBeInTheDocument();
  });
});
