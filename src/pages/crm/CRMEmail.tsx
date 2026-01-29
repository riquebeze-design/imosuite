import { useSeo } from "@/lib/seo";
import { CRMShell } from "@/components/crm/CRMShell";
import { CRMLogin } from "@/components/crm/CRMLogin";
import { EmailCampaignBuilder } from "@/components/EmailCampaignBuilder";
import { useAppStore } from "@/state/AppStore";

export default function CRMEmailPage() {
  useSeo({ title: "E-mail marketing — CRM AtlasCasa" });
  const { currentAgent } = useAppStore();
  if (!currentAgent) return <CRMLogin />;

  return (
    <CRMShell title="E-mail marketing">
      <EmailCampaignBuilder />
    </CRMShell>
  );
}
