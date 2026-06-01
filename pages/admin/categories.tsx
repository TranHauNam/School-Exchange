import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { Modal } from '@/components/common/Modal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Category } from '@/lib/types/category';
import { useRequireRole } from '@/lib/withRoleGuard';
import { categoryStatusLabel } from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function CategoriesPage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['system-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadCategories = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try { setCategories(await mockApi.categories.list()); setStatus('ready'); }
    catch (e) { setErrorMessage(e instanceof ApiError ? e.message : 'Không thể tải danh mục.'); setStatus('error'); }
  }, []);

  useEffect(() => { if (!isAuthorized) return; const t = setTimeout(() => { void loadCategories(); }, 120); return () => clearTimeout(t); }, [isAuthorized, loadCategories]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head><title>Danh mục · School Item Exchange</title></Head>
      <DashboardLayout eyebrow="Quản trị hệ thống" title="Danh mục">
        <PageHead title="Quản lý danh mục" description="Quản lý danh mục được phép đăng." actions={<Button variant="primary" onClick={() => { setAddName(''); setAddDesc(''); setAddOpen(true); }}>Thêm danh mục</Button>} />

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={() => { void loadCategories(); }} />}
        {status === 'ready' && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tên</th><th>Mô tả</th><th>Trạng thái</th><th>Số sản phẩm</th><th>Thao tác</th></tr></thead>
              <tbody>
                {categories.length === 0 ? <tr><td colSpan={5}><EmptyState message="Chưa có danh mục." /></td></tr> :
                  categories.map(category => (
                    <tr key={category.name}>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.desc}</td>
                      <td><Badge status={category.status} label={categoryStatusLabel(category.status)} /></td>
                      <td>{category.count}</td>
                      <td>
                        <div className="row">
                          <Button variant="secondary" onClick={() => { setEditTarget(category); setEditName(category.name); setEditDesc(category.desc); setEditOpen(true); }}>Sửa</Button>
                          <Button variant="secondary" onClick={async () => {
                            try { await mockApi.categories.toggleActive(category.name); show('Đã chuyển trạng thái danh mục.', 'success'); await loadCategories(); }
                            catch (e) { show(e instanceof ApiError ? e.message : 'Lỗi chuyển trạng thái.', 'error'); }
                          }}>{category.status === 'Active' ? 'Tắt' : 'Bật'}</Button>
                          <Button variant="secondary" onClick={async () => {
                            try { await mockApi.categories.remove(category.name); show('Đã xóa danh mục.', 'success'); await loadCategories(); }
                            catch (e) { show(e instanceof ApiError ? e.message : 'Lỗi xóa danh mục.', 'error'); }
                          }}>Xóa</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <Modal open={addOpen} title="Thêm danh mục" onClose={() => setAddOpen(false)}>
          <Field label="Tên danh mục"><Input value={addName} onChange={e => setAddName(e.target.value)} /></Field>
          <Field label="Mô tả"><Input value={addDesc} onChange={e => setAddDesc(e.target.value)} /></Field>
          <Button variant="primary" loading={false} onClick={async () => {
            try { await mockApi.categories.create(addName, addDesc); show('Đã thêm danh mục.', 'success'); setAddOpen(false); await loadCategories(); }
            catch (e) { show(e instanceof ApiError ? e.message : 'Lỗi thêm danh mục.', 'error'); }
          }}>Lưu</Button>
        </Modal>
        <Modal open={editOpen} title="Sửa danh mục" onClose={() => setEditOpen(false)}>
          <Field label="Tên danh mục"><Input value={editName} onChange={e => setEditName(e.target.value)} /></Field>
          <Field label="Mô tả"><Input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></Field>
          <Button variant="primary" onClick={async () => {
            if (!editTarget) return;
            try { await mockApi.categories.update(editTarget.name, { name: editName, desc: editDesc }); show('Đã cập nhật danh mục.', 'success'); setEditOpen(false); await loadCategories(); }
            catch (e) { show(e instanceof ApiError ? e.message : 'Lỗi cập nhật danh mục.', 'error'); }
          }}>Lưu</Button>
        </Modal>
      </DashboardLayout>
    </>
  );
}
