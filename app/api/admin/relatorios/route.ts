import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/rbac";
import { hasServiceRole } from "@/lib/env";
import {
  REPORT_TYPES,
  buildReport,
  toCSV,
  type ReportType,
} from "@/lib/admin/reports";
import { writeAuditLog } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isStaff(user.roles)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!hasServiceRole()) {
    return new NextResponse("Service role ausente", { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const type = sp.get("type") as ReportType | null;
  if (!type || !REPORT_TYPES.includes(type)) {
    return new NextResponse("Tipo inválido", { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const fromDay = sp.get("from") && DAY.test(sp.get("from")!)
    ? sp.get("from")!
    : "2020-01-01";
  const toDay =
    sp.get("to") && DAY.test(sp.get("to")!) ? sp.get("to")! : today;

  const fromISO = `${fromDay}T00:00:00.000Z`;
  const toISO = `${toDay}T23:59:59.999Z`;

  const data = await buildReport(type, fromISO, toISO);
  const csv = toCSV(data);

  await writeAuditLog({
    actorUserId: user.id,
    action: "admin.report_exported",
    entityType: "report",
    after: { type, from: fromDay, to: toDay, rows: data.rows.length },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${type}-${fromDay}_${toDay}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
