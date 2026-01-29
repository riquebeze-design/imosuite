import { CRMLogin } from "@/components/crm/CRMLogin";
import { CRMShell } from "@/components/crm/CRMShell";
import { AgentDashboard } from "@/components/AgentDashboard";
import { useAppStore } from "@/state/AppStore";
import { useSeo } from "@/lib/seo";

export default function CRMIndex() {
  useSeo({ title: "CRM — AtlasCasa" });
  const { currentAgent } = useAppStore();

  if (!currentAgent) return <CRMLogin />;

  return (
    <CRMShell title="Dashboard">
      <AgentDashboard />
    </CRMShell>
  );
}
