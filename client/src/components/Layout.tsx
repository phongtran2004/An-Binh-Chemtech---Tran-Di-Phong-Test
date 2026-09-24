import { NavLink, Outlet, useLocation } from 'react-router-dom';

/**
 * Layout - Main application shell with sidebar navigation.
 * Clean sidebar: branding + navigation only, no clutter.
 */

const NAV_ITEMS = [
  { to: '/', label: 'Khách hàng', icon: '👥' },
  { to: '/quotations', label: 'Báo giá', icon: '📋' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>An Bình Chemtech</h1>
          <p>Hệ thống quản lý nội bộ</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/' || location.pathname.startsWith('/customers')
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
