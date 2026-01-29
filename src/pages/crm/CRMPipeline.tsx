import { useSeo } from "@/lib/seo";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { CRMPipelineBoard } from "@/components/CRMPipelineBoard";
import { useAppStore } from "@/state/AppStore";

export default function CRMPipelinePage() {
  useSeo({ title: "Pipeline — CRM AtlasCasa" });
  const { currentAgent } = useAppStore();
  if (!currentAgent) return <CRMLogin />;

  return (
    <CRMShell title="Pipeline">
      <CRMPipelineBoard />
    </CRMShell>
  );
}
