import { hash as bcryptHash } from "bcryptjs";
import { PIN_COLORS } from "@/lib/colors";
import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPERADMIN_VOTER_ID = "00000000-0000-0000-0000-000000000001";
export const SUPERADMIN_VOTER_ID_2 = "00000000-0000-0000-0000-000000000002";

/** Every hardcoded superadmin voter id — protected from deletion/wipe. */
export const SUPERADMIN_VOTER_IDS = [SUPERADMIN_VOTER_ID, SUPERADMIN_VOTER_ID_2];

const SUPERADMIN_SEEDS = [
  { voter_id: SUPERADMIN_VOTER_ID, name: "Nick V", pin: "12", pin_color: PIN_COLORS[0] },
  { voter_id: SUPERADMIN_VOTER_ID_2, name: "Knox V", pin: "12", pin_color: PIN_COLORS[1] },
];

export async function ensureSuperadmin(supabase: SupabaseClient): Promise<void> {
  try {
    for (const seed of SUPERADMIN_SEEDS) {
      const pinHash = await bcryptHash(seed.pin, 10);
      await supabase.from("v2_voters").upsert(
        {
          voter_id: seed.voter_id,
          name: seed.name,
          display_name: seed.name,
          pin_hash: pinHash,
          pin_plain: seed.pin,
          pin_color: seed.pin_color,
          is_active: true,
          role: "super_admin",
        },
        { onConflict: "voter_id" },
      );
    }
  } catch {
    // silent
  }
}
