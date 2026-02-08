import {
  Home,
  FilePlus,
  History,
  Settings,
  User,
  Info,
  HelpCircle,
  LogOut,
  Receipt,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Create Receipt', url: '/create', icon: FilePlus },
  { title: 'History', url: '/history', icon: History },
];

const secondaryNav = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'About', url: '/about', icon: Info },
  { title: 'Support', url: '/support', icon: HelpCircle },
];

export function AppSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar>
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Receipt className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="font-bold text-base text-sidebar-foreground">Quick Receipt</span>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
