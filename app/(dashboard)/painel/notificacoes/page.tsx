import type { Metadata } from "next";

import { listMyNotifications } from "@/lib/notifications/queries";
import { renderNotification } from "@/lib/notifications/render";
import { PageHeader } from "@/components/dashboard/ui";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const rows = await listMyNotifications(60);
  const items = rows.map(renderNotification);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Avisos sobre suas doações, saques, campanhas e verificação de identidade."
      />
      <NotificationsList items={items} />
    </div>
  );
}
