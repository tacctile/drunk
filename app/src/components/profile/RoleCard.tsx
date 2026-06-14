"use client";

import { Icon } from "@/components/Icon";
import {
  ROLE_LABELS,
  ROLE_BADGE_ICONS,
  MODERATOR_PERMISSIONS,
  MODERATOR_RESTRICTIONS,
  type UserRole,
} from "@/lib/roles";

export function RoleCard({ role }: { role: NonNullable<UserRole> }) {
  const isSA = role === "super_admin";
  const colorClass = isSA ? "text-accent" : "text-green";

  return (
    <section className="mt-4">
      <div className="card">
        <div className="flex items-center gap-2">
          <Icon name={ROLE_BADGE_ICONS[role]} size={20} className={colorClass} />
          <span className={`text-title ${colorClass}`}>{ROLE_LABELS[role]}</span>
        </div>
        {isSA ? (
          <p className="mt-2 text-meta font-normal text-ink-muted">Full access</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <p className="text-meta font-semibold text-green">Can do</p>
              {MODERATOR_PERMISSIONS.map((p) => (
                <div key={p} className="mt-1 flex items-start gap-1.5">
                  <Icon name="check" size={14} className="mt-0.5 flex-none text-green" />
                  <span className="text-meta font-normal text-ink-muted">{p}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-meta font-semibold text-red">Cannot do</p>
              {MODERATOR_RESTRICTIONS.map((r) => (
                <div key={r} className="mt-1 flex items-start gap-1.5">
                  <Icon name="close" size={14} className="mt-0.5 flex-none text-red" />
                  <span className="text-meta font-normal text-ink-muted">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
