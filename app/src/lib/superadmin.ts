import { hash as bcryptHash } from "bcryptjs";
import { PIN_COLORS } from "@/lib/colors";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPERADMIN_VOTER_ID = "00000000-0000-0000-0000-000000000001";

export async function ensureSuperadmin(supabase: SupabaseClient): Promise<void> {
  try {
    const pinHash = await bcryptHash("12", 10);
    await supabase.from("v2_voters").upsert(
      {
        voter_id: SUPERADMIN_VOTER_ID,
        name: "Nick V",
        display_name: "Nick V",
        pin_hash: pinHash,
        pin_plain: "12",
        pin_color: PIN_COLORS[0],
        is_active: true,
        role: "super_admin",
      },
      { onConflict: "voter_id" },
    );
  } catch {
    // silent
  }
}
