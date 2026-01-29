import { Link, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/state/AppStore";
import {
  BarChart3,
  Bot,
  Kanban,
  Mail,
  Settings,
  Users,
  LogOut,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Item({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            cn(
              "rounded-xl",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )
          }
        >
          {icon}
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function CRMShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { currentAgent, dispatch } = useAppStore();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" className="bg-sidebar">
        <SidebarHeader className="px-3 pt-3">
          <Link to="/" className="block">
            <BrandMark />
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">Área interna</div>
            <Badge className="rounded-full bg-accent text-accent-foreground ring-1 ring-accent/50">
              demo
            </Badge>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Item to="/crm" icon={<BarChart3 />} label="Dashboard" />
                <Item to="/crm/pipeline" icon={<Kanban />} label="Pipeline" />
                <Item to="/crm/leads" icon={<Users />} label="Leads" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Automação & Marketing</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Item to="/crm/automacoes" icon={<Bot />} label="Automações" />
                <Item to="/crm/email" icon={<Mail />} label="E-mail marketing" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Item to="/" icon={<Home />} label="Voltar ao site" />
                <Item to="/crm/definicoes" icon={<Settings />} label="Definições" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          {currentAgent && (
            <div className="rounded-2xl border bg-background/60 p-3">
              <div className="text-sm font-semibold tracking-tight">
                {currentAgent.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Perfil: {currentAgent.role}
              </div>
              <Button
                variant="secondary"
                className="mt-3 w-full rounded-2xl"
                onClick={() => dispatch({ type: "session_logout" })}
              >
                <LogOut className="h-4 w-4" />
                Terminar sessão
              </Button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="mx-auto max-w-6xl px-4 py-8">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {title}
              </h1>
            </div>
          )}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}