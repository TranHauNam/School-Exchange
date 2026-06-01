import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi, type UserProfile } from '@/lib/services/mockApi';
import { useRequireRole } from '@/lib/withRoleGuard';
import { profileSchema, type ProfileInput } from '@/lib/types/schemas';
import { ROLE_LABEL } from '@/lib/types/role';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function ProfilePage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const loadProfile = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await mockApi.auth.getProfile();
      setProfile(data);
      reset({ fullName: data.fullName, phone: data.phone });
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải thông tin hồ sơ.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [reset]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timeout = window.setTimeout(() => { void loadProfile(); }, 120);
    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadProfile]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await mockApi.auth.updateProfile({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
      });
      setProfile(updated);
      setEditing(false);
      show('Đã cập nhật hồ sơ.', 'success');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';
      show(message, 'error');
    }
  });

  const startEdit = () => {
    if (profile) {
      reset({ fullName: profile.fullName, phone: profile.phone });
    }
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    if (profile) {
      reset({ fullName: profile.fullName, phone: profile.phone });
    }
  };

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Hồ sơ · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Hồ sơ cá nhân">
        <PageHead
          eyebrow="Bảng tin trường"
          title="Hồ sơ cá nhân"
          description="Xem và chỉnh sửa thông tin cá nhân của bạn."
        />

        {status === 'loading' && <LoadingState message="Đang tải hồ sơ..." />}
        {status === 'error' && (
          <ErrorState
            message={errorMessage || 'Không thể tải thông tin hồ sơ.'}
            onRetry={() => { void loadProfile(); }}
          />
        )}

        {status === 'ready' && profile && (
          <section className="stack">
            {/* ---- View mode ---- */}
            {!editing && (
              <div className="card stack">
                <div className="between">
                  <h2>Thông tin cá nhân</h2>
                  <button type="button" className="btn primary" onClick={startEdit}>
                    Chỉnh sửa
                  </button>
                </div>

                <div className="profile-detail">
                  <div className="profile-row">
                    <span className="profile-label">Họ tên</span>
                    <span className="profile-value">{profile.fullName}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Email</span>
                    <span className="profile-value">{profile.email}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Số điện thoại</span>
                    <span className="profile-value">{profile.phone || '—'}</span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Vai trò</span>
                    <span className="profile-value">{ROLE_LABEL[profile.roleKey]}</span>
                  </div>
                  {profile.ownerRole && (
                    <div className="profile-row">
                      <span className="profile-label">Loại tài khoản</span>
                      <span className="profile-value">
                        {profile.ownerRole === 'Student' ? 'Học sinh' : 'Giáo viên'}
                      </span>
                    </div>
                  )}
                  <div className="profile-row">
                    <span className="profile-label">Trạng thái</span>
                    <span className="profile-value">
                      {profile.status === 'Active' ? (
                        <span className="badge success">Đang hoạt động</span>
                      ) : profile.status === 'Locked' ? (
                        <span className="badge warning">Đã khóa</span>
                      ) : (
                        <span className="badge">{profile.status}</span>
                      )}
                    </span>
                  </div>
                  <div className="profile-row">
                    <span className="profile-label">Ngày tham gia</span>
                    <span className="profile-value muted">
                      {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Edit mode ---- */}
            {editing && (
              <div className="card stack">
                <h2>Chỉnh sửa hồ sơ</h2>
                <p className="muted">Cập nhật thông tin cá nhân của bạn bên dưới.</p>

                <form className="stack" onSubmit={onSubmit}>
                  <div className="field">
                    <label htmlFor="fullName">Họ tên</label>
                    <input
                      id="fullName"
                      className="input"
                      disabled={isSubmitting}
                      {...register('fullName')}
                    />
                    <span className="error-text">{errors.fullName?.message ?? ''}</span>
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      className="input"
                      disabled={isSubmitting}
                      {...register('phone')}
                    />
                    <span className="error-text">{errors.phone?.message ?? ''}</span>
                  </div>

                  <div className="field muted small">
                    <p>
                      <strong>Email:</strong> {profile.email}{' '}
                      <em>(không thể thay đổi)</em>
                    </p>
                  </div>

                  <div className="row" style={{ gap: 8 }}>
                    <button
                      type="submit"
                      className="btn primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={isSubmitting}
                      onClick={cancelEdit}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}
      </DashboardLayout>
    </>
  );
}
