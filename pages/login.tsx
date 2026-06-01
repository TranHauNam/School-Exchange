import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/lib/auth-context';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { loginSchema, type LoginInput } from '@/lib/types/schemas';
import type { RoleKey } from '@/lib/types/role';
import { useToast } from '@/components/common/Toast';
import { ApiError } from '@/lib/services/mockApi';

const ROUTE_BY_ROLE: Record<RoleKey, string> = {
  member: '/member/feed',
  'system-admin': '/admin/dashboard',
  'activity-admin': '/activity-admin/my-campaigns',
};

// Quick‑login demo accounts
const QUICK_LOGIN: { roleKey: RoleKey; label: string; email: string; isAdmin: boolean }[] = [
  { roleKey: 'member', label: 'Member', email: 'an@student.school.edu', isAdmin: false },
  { roleKey: 'system-admin', label: 'System Admin', email: 'huyle', isAdmin: true },
  { roleKey: 'activity-admin', label: 'Activity Admin', email: 'greenlife', isAdmin: true },
];

const DEFAULT_PASSWORD = 'school123';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { show } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [submittingRole, setSubmittingRole] = useState<RoleKey | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'an@student.school.edu',
      password: DEFAULT_PASSWORD,
    },
  });

  const canInteract = useMemo(
    () => !isSubmitting && submittingRole === null,
    [isSubmitting, submittingRole],
  );

  const doLogin = async (email: string, password: string, isAdmin: boolean, roleKey?: RoleKey) => {
    setAuthError(null);
    if (roleKey) setSubmittingRole(roleKey);
    try {
      const session = await login(email, password, isAdmin);
      show('Đăng nhập thành công.');
      // Small delay so React commits the session state before navigation
      await new Promise((r) => setTimeout(r, 50));
      await router.replace(ROUTE_BY_ROLE[session.roleKey] || '/member/feed');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể kết nối tới máy chủ. Vui lòng thử lại.';
      setAuthError(message);
      show(message);
    } finally {
      setSubmittingRole(null);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const email = values.email.trim();
    // Detect admin by known usernames (admin accounts use username, not email)
    const isAdmin = email === 'huyle' || email === 'greenlife';
    await doLogin(email, values.password, isAdmin);
  });

  return (
    <>
      <Head>
        <title>Login · School Item Exchange</title>
      </Head>

      <AuthLayout>
        <section className="login-hero">
          <Link className="brand" href="/">
            <span className="logo">S</span>
            <span>School Item Exchange</span>
          </Link>

          <div className="stack">
            <p className="eyebrow">School Feed</p>
            <h1>Bảng tin trao đổi đồ dùng học đường an toàn trong trường.</h1>
            <p>
              Học sinh và giáo viên tạo bài đăng bán lại, trao đổi hoặc quyên
              góp. Campaign hoạt động như group riêng và admin duyệt trước khi
              hiển thị công khai.
            </p>
          </div>

          <div className="kpi-strip">
            <div className="kpi">
              <strong>3 flow</strong>
              <p>Approval, request, campaign</p>
            </div>
            <div className="kpi">
              <strong>Dữ liệu mẫu</strong>
              <p>Express + MongoDB</p>
            </div>
            <div className="kpi">
              <strong>Responsive</strong>
              <p>Desktop, tablet, mobile</p>
            </div>
          </div>
        </section>

        <section className="login-card">
          <form className="card stack" onSubmit={onSubmit}>
            <div className="stack">
              <h2>Đăng nhập</h2>
              <p>Dùng tài khoản trường để đăng nhập</p>
            </div>

            <div className="field">
              <label htmlFor="email">Email hoặc Username</label>
              <input
                id="email"
                className="input"
                aria-describedby="emailHelp"
                disabled={!canInteract}
                {...register('email')}
              />
              <span id="emailHelp" className="small muted">
                Dùng email trường cấp hoặc username.
              </span>
              <span className="error-text">{errors.email?.message ?? ''}</span>
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="row" style={{ gap: 8 }}>
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  style={{ flex: 1 }}
                  disabled={!canInteract}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="btn secondary"
                  disabled={!canInteract}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <span className="error-text">{errors.password?.message ?? ''}</span>
            </div>

            {authError ? <p className="error-text">{authError}</p> : null}

            <button
              type="submit"
              className="btn primary full"
              disabled={!canInteract}
            >
              {isSubmitting
                ? 'Đang đăng nhập...'
                : 'Đăng nhập với vai trò từ tài khoản'}
            </button>

            <div className="divider" />
            <p className="small">Chọn nhanh vai trò</p>

            <div className="role-buttons">
              {QUICK_LOGIN.map((q) => (
                <button
                  key={q.roleKey}
                  type="button"
                  className="btn secondary"
                  disabled={!canInteract}
                  onClick={() => doLogin(q.email, DEFAULT_PASSWORD, q.isAdmin, q.roleKey)}
                >
                  {submittingRole === q.roleKey ? 'Đang vào...' : q.label}
                </button>
              ))}
            </div>
          </form>
        </section>
      </AuthLayout>
    </>
  );
}
