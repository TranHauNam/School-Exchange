/**
 * Task 15.1–15.2 — Component tests (Vitest + React Testing Library).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { ToastProvider } from '@/components/common/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { ApprovalActions } from '@/components/admin/ApprovalActions';
import { PostComposer } from '@/components/feed/PostComposer';
import { RequestModal } from '@/components/feed/RequestModal';
import type { FeedFilters as FeedFiltersValue } from '@/lib/services/mockApi';
import type { Category } from '@/lib/types/category';
import type { Campaign } from '@/lib/types/campaign';
import type { Post } from '@/lib/types/post';

// ---------------------------------------------------------------------------
// Test wrapper for components that need ToastProvider
// ---------------------------------------------------------------------------
function Wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ToastProvider, null, children);
}

// ---------------------------------------------------------------------------
// 15.2 — Sidebar: render đúng nhóm menu theo từng RoleKey
// ---------------------------------------------------------------------------
describe('15.2 — Sidebar menu by role', () => {
  it('should render Member menu items', () => {
    render(
      React.createElement(Sidebar, {
        roleKey: 'member',
        activePath: '/member/feed',
      }),
    );

    expect(screen.getByText('School Feed')).toBeInTheDocument();
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('My Posts')).toBeInTheDocument();
    expect(screen.getByText('My Requests')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should render System Admin menu items', () => {
    render(
      React.createElement(Sidebar, {
        roleKey: 'system-admin',
        activePath: '/admin/dashboard',
      }),
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Post Approval')).toBeInTheDocument();
    expect(screen.getByText('Post Management')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Campaign Management')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('should render Activity Admin menu items', () => {
    render(
      React.createElement(Sidebar, {
        roleKey: 'activity-admin',
        activePath: '/activity-admin/my-campaigns',
      }),
    );

    expect(screen.getByText('My Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
    expect(screen.getByText('Campaign Posts')).toBeInTheDocument();
    expect(screen.getByText('Campaign Results')).toBeInTheDocument();
  });

  it('should highlight the active nav item', () => {
    render(
      React.createElement(Sidebar, {
        roleKey: 'member',
        activePath: '/member/my-posts',
      }),
    );

    const activeLink = screen.getByText('My Posts').closest('a');
    expect(activeLink).toBeInTheDocument();
    expect(activeLink?.className).toContain('active');
  });
});

// ---------------------------------------------------------------------------
// 15.1 — FeedFilters: phát đúng onChange
// ---------------------------------------------------------------------------
describe('15.1 — FeedFilters onChange', () => {
  const categories: Category[] = [
    { name: 'Books', desc: '', status: 'Active', count: 10 },
    { name: 'Sports', desc: '', status: 'Active', count: 5 },
  ];

  it('should emit onChange with keyword', () => {
    const onChange = vi.fn();
    render(
      React.createElement(FeedFilters, {
        categories,
        value: { keyword: '', sort: 'Newest' },
        onChange,
      }),
    );

    const input = screen.getByPlaceholderText(/tìm bài đăng/i);
    fireEvent.change(input, { target: { value: 'casio' } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as FeedFiltersValue;
    expect(lastCall.keyword).toBe('casio');
  });

  it('should emit onChange with category filter', () => {
    const onChange = vi.fn();
    render(
      React.createElement(FeedFilters, {
        categories,
        value: { keyword: '', sort: 'Newest' },
        onChange,
      }),
    );

    const selects = screen.getAllByRole('combobox');
    // First select = category
    fireEvent.change(selects[0], { target: { value: 'Books' } });

    const call = onChange.mock.calls.at(-1)?.[0] as FeedFiltersValue;
    expect(call.category).toBe('Books');
  });

  it('should emit onChange with type filter', () => {
    const onChange = vi.fn();
    render(
      React.createElement(FeedFilters, {
        categories,
        value: { keyword: '', sort: 'Newest' },
        onChange,
      }),
    );

    const selects = screen.getAllByRole('combobox');
    // Second select = type
    fireEvent.change(selects[1], { target: { value: 'Sale' } });

    const call = onChange.mock.calls.at(-1)?.[0] as FeedFiltersValue;
    expect(call.type).toBe('Sale');
  });

  it('should emit onChange with sort', () => {
    const onChange = vi.fn();
    render(
      React.createElement(FeedFilters, {
        categories,
        value: { keyword: '', sort: 'Newest' },
        onChange,
      }),
    );

    const selects = screen.getAllByRole('combobox');
    // Third select = sort
    fireEvent.change(selects[2], { target: { value: 'Price low to high' } });

    const call = onChange.mock.calls.at(-1)?.[0] as FeedFiltersValue;
    expect(call.sort).toBe('Price low to high');
  });
});

// ---------------------------------------------------------------------------
// 15.1 — ApprovalActions: Reject chỉ gọi khi lý do khác rỗng
// ---------------------------------------------------------------------------
describe('15.1 — ApprovalActions reject reason validation', () => {
  it('should NOT call onReject with empty reason', async () => {
    const onView = vi.fn();
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ApprovalActions, { onView, onApprove, onReject }),
      ),
    );

    // Open reject modal
    fireEvent.click(screen.getByText('Reject'));
    expect(screen.getByText('Lý do từ chối')).toBeInTheDocument();

    // Try to submit without reason (form validation via RHF+Zod blocks it)
    const confirmBtn = screen.getByText('Xác nhận từ chối');
    fireEvent.click(confirmBtn);

    // onReject should NOT be called (validation blocks empty reason)
    expect(onReject).not.toHaveBeenCalled();
  });

  it('should call onReject with non-empty reason', async () => {
    const onView = vi.fn();
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onReject = vi.fn().mockResolvedValue(undefined);

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ApprovalActions, { onView, onApprove, onReject }),
      ),
    );

    // Open reject modal
    fireEvent.click(screen.getByText('Reject'));

    // Type a reason
    const textarea = screen.getByPlaceholderText(/nhập lý do/i);
    await userEvent.type(textarea, 'Vi phạm nội quy.');

    // Submit
    const confirmBtn = screen.getByText('Xác nhận từ chối');
    fireEvent.click(confirmBtn);

    // onReject should be called with the reason (wait for async handleSubmit)
    await waitFor(() => {
      expect(onReject).toHaveBeenCalledWith('Vi phạm nội quy.');
    });
  });

  it('should call onView and onApprove', async () => {
    const onView = vi.fn();
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const onReject = vi.fn();

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ApprovalActions, { onView, onApprove, onReject }),
      ),
    );

    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Approve'));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 15.1 — PostComposer: ẩn/hiện giá theo Type, validation
// ---------------------------------------------------------------------------
describe('15.1 — PostComposer price visibility and validation', () => {
  const categories: Category[] = [
    { name: 'Books', desc: '', status: 'Active', count: 10 },
    { name: 'Sports', desc: '', status: 'Active', count: 5 },
  ];
  const campaigns: Campaign[] = [];

  it('should show price field when Sale is selected', () => {
    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(PostComposer, {
          categories,
          campaigns,
          onSubmit: vi.fn(),
        }),
      ),
    );

    // Price field is visible for Sale (default type)
    expect(screen.getByLabelText('Price')).toBeInTheDocument();
  });

  it('should hide price field for Exchange', () => {
    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(PostComposer, {
          categories,
          campaigns,
          onSubmit: vi.fn(),
        }),
      ),
    );

    // Switch to Exchange
    const typeSelect = screen.getByLabelText('Transaction type');
    fireEvent.change(typeSelect, { target: { value: 'Exchange' } });

    // Price field should be hidden
    expect(screen.queryByLabelText('Price')).not.toBeInTheDocument();
  });

  it('should hide price field for Donation', () => {
    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(PostComposer, {
          categories,
          campaigns,
          onSubmit: vi.fn(),
        }),
      ),
    );

    // Switch to Donation
    const typeSelect = screen.getByLabelText('Transaction type');
    fireEvent.change(typeSelect, { target: { value: 'Donation' } });

    // Price field should be hidden
    expect(screen.queryByLabelText('Price')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 15.1 — RequestModal: chặn thiếu message/contact
// ---------------------------------------------------------------------------
describe('15.1 — RequestModal validation', () => {
  const post: Post = {
    id: 'p1',
    title: 'Test item',
    icon: '∑',
    type: 'Sale',
    price: 100000,
    category: 'Books',
    owner: 'Nguyễn Văn B',
    ownerRole: 'Student',
    status: 'Approved',
    date: '2026-05-20',
    content: 'Test content',
    description: 'Test desc',
    contact: 'contact@test.com',
  };

  it('should NOT call onSubmit with empty message', async () => {
    const onSubmit = vi.fn();

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(RequestModal, {
          open: true,
          post,
          onClose: vi.fn(),
          onSubmit,
        }),
      ),
    );

    // Clear the pre-filled contact and try to submit
    const contactInput = screen.getByLabelText(/thông tin liên hệ/i);
    await userEvent.clear(contactInput);

    const submitBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    fireEvent.click(submitBtn);

    // onSubmit should NOT be called (Zod validation blocks)
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it('should call onSubmit with valid message and contact', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(RequestModal, {
          open: true,
          post,
          onClose: vi.fn(),
          onSubmit,
        }),
      ),
    );

    // Fill in message
    const messageInput = screen.getByPlaceholderText(/mình muốn nhận/i);
    await userEvent.type(messageInput, 'Xin chào, mình muốn mua.');

    // Contact is pre-filled, submit
    const submitBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    fireEvent.click(submitBtn);

    // onSubmit should be called with message and contact
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        'Xin chào, mình muốn mua.',
        expect.any(String),
      );
    });
  });
});
