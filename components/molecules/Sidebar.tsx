'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/styles/layout.css';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/create/manual', label: 'New Persona' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Synapse</div>
      <nav className="sidebar__nav">
        {links.map(({ href, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
