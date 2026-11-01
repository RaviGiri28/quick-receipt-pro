import {
  Home, FilePlus, History, Settings, User, Info, LifeBuoy, LogOut, Bookmark, HelpCircle, Newspaper, Bell, PenSquare, Megaphone, Users, Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { badgeText } from '@/lib/blog';
import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { LegalLinks } from '@/components/SiteFooter';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: number;
  // Anchor for the guided tour.
  tour?: string;
}

const mainNav: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Create Receipt', url: '/create', icon: FilePlus, tour: 'nav-create' },
  { title: 'Saved Receipts', url: '/saved', icon: Bookmark },
  { title: 'History', url: '/history', icon: History },
];

const secondaryNav: NavItem[] = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'About', url: '/about', icon: Info },
  { title: 'FAQs', url: '/faq', icon: HelpCircle },
  { title: 'Support', url: '/support', icon: LifeBuoy },
];

const linkClass =
  'group/nav relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-medium text-white/80 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white';
const activeClass =
  '!bg-white/[0.16] !text-white font-semibold shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20 hover:!translate-x-0';

const adminNav: NavItem[] = [
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Coupons', url: '/admin/coupons', icon: Ticket },
  { title: 'Publish Blog', url: '/admin/blog', icon: PenSquare },
  { title: 'Announcements', url: '/admin/announcements', icon: Megaphone },
];

function NavGroup({ label, items, tour }: { label: string; items: NavItem[]; tour?: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarGroup className="px-3" data-tour={tour}>
      <SidebarGroupLabel className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map(item => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent active:bg-transparent">
                <NavLink
                  to={item.url}
                  end={item.url === '/'}
                  className={linkClass}
                  activeClassName={activeClass}
                  onClick={() => isMobile && setOpenMobile(false)}
                  data-tour={item.tour}
                >
                  <item.icon className="!h-5 !w-5 transition-transform duration-300 group-hover/nav:scale-110" />
                  <span>{item.title}</span>
                  {!!item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-primary">
                      {badgeText(item.badge)}
                    </span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadCount();
  const updatesNav: NavItem[] = [
    { title: 'Blog', url: '/blog', icon: Newspaper },
    { title: 'Notifications', url: '/notifications', icon: Bell, badge: unread },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="px-5 pb-4 pt-6">
        <Logo variant="light" markClassName="h-11 w-11" textClassName="text-[1.4rem]" />
      </SidebarHeader>
      <div className="mx-5 h-px bg-white/15" />
      <SidebarContent className="gap-2 pt-4">
        <NavGroup label="Main" items={mainNav} tour="nav-main" />
        <NavGroup label="Updates" items={updatesNav} />
        {user?.isAdmin && <NavGroup label="Admin" items={adminNav} />}
        <NavGroup label="More" items={secondaryNav} />
      </SidebarContent>
      <SidebarFooter className="gap-3 p-4">
        <LegalLinks className="text-white/60 [&_a:hover]:text-white" />
        <button
          onClick={handleLogout}
          className="group/nav flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-semibold text-white bg-red-600 shadow-sm transition-all duration-200 hover:bg-red-700 active:bg-red-800"
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover/nav:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
