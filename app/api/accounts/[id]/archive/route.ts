/**
 * POST: archive account (soft-delete). Archived accounts cannot receive new transactions.
 */

import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { archiveAccount } from "@/lib/services/account.service"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  try {
    const account = await archiveAccount(id, session.user.id)
    return NextResponse.json(account)
  } catch (e) {
    if (e instanceof Error && e.message === "Account not found") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to archive" },
      { status: 500 }
    )
  }
}
