import Link from 'next/link';

import { MENU_BY_ROLE } from '@/lib/menu';
import { ROLE_LABEL, type RoleKey } from '@/lib/types/role';

interface SidebarProps {
  roleKey: RoleKey;
  activePath: string;
  onCloseDrawer?: () => void;
}

function isActive(href: string, activePath: string): boolean {
  if (href === '#') {
    return false;
  }
  if (activePath === href) {
    return true;
  }
  return activePath.startsWith(`${href}/`);
}

export function Sidebar({ roleKey, activePath, onCloseDrawer }: SidebarProps) {
  const menu = MENU_BY_ROLE[roleKey];

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="btn secondary sidebar-close"
        onClick={onCloseDrawer}
      >
        Đóng menu
      </button>

      <Link className="brand" href="/">
        <span className="logo">S</span>
        <span>
          School Item
          <br />
          Exchange
        </span>
      </Link>

      <div className="role-pill">
        Vai trò hiện tại: <strong>{ROLE_LABEL[roleKey]}</strong>
      </div>

      <nav className="nav" aria-label="Điều hướng chính">
        {menu.map((item) => {
          if (item.href === '#') {
            return (
              <a
                key={item.label}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  onCloseDrawer?.();
                }}
              >
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href, activePath) ? 'active' : ''}
              onClick={onCloseDrawer}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
