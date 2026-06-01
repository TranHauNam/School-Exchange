import Head from 'next/head';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <>
      <Head>
        <title>403 · School Item Exchange</title>
      </Head>

      <main className="main">
        <section className="card stack">
          <p className="eyebrow">403 Forbidden</p>
          <h1>Bạn không đủ quyền truy cập</h1>
          <p className="muted">
            Vai trò hiện tại của bạn không thể truy cập màn hình này.
          </p>
          <div className="row" style={{ gap: 12 }}>
            <Link className="btn secondary" href="/login">
              Quay lại đăng nhập
            </Link>
            <Link className="btn primary" href="/">
              Về trang điều hướng
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
