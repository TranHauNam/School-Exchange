import type { Session } from '@/lib/services/mockApi';

interface HeaderProps {
  session: Session;
  eyebrow?: string;
  title?: string;
  onOpenDrawer?: () => void;
  onLogout: () => Promise<void>;
}

function avatarText(name: string): string {
  const tokens = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2);
  return tokens.map((token) => token[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function Header({
  session,
  eyebrow,
  title,
  onOpenDrawer,
  onLogout,
}: HeaderProps) {
  return (
    <header className="header">
      <button
        type="button"
        className="btn secondary mobile-menu"
        onClick={onOpenDrawer}
      >
        Menu
      </button>

      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <strong>{title ?? 'School Item Exchange'}</strong>
      </div>

      <div className="user-menu">
        <span className="avatar">{avatarText(session.userName)}</span>
        <span className="name">{session.userName}</span>
        <button
          type="button"
          className="btn ghost"
          onClick={() => void onLogout()}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
