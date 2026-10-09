import {
  Home, FilePlus, History, Settings, User, Info, LifeBuoy, LogOut, Bookmark,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Create Receipt', url: '/create', icon: FilePlus },
  { title: 'Saved Receipts', url: '/saved', icon: Bookmark },
  { title: 'History', url: '/history', icon: History },
];

const secondaryNav = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'About', url: '/about', icon: Info },
  { title: 'Support', url: '/support', icon: LifeBuoy },
];

const linkClass =
  'group/nav relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-medium text-white/80 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white';
const activeClass =
  '!bg-white/[0.16] !text-white font-semibold shadow-[0_10px_24px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/20 hover:!translate-x-0';

function NavGroup({ label, items }: { label: string; items: typeof mainNav }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarGroup className="px-3">
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
                >
                  <item.icon className="!h-5 !w-5 transition-transform duration-300 group-hover/nav:scale-110" />
                  <span>{item.title}</span>
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
  const { logout } = useAuth();
  const navigate = useNavigate();

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
        <NavGroup label="Main" items={mainNav} />
        <NavGroup label="More" items={secondaryNav} />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <button
          onClick={handleLogout}
          className="group/nav flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 transition-transform duration-300 group-hover/nav:-translate-x-0.5" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
