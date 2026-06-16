"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { useLocations } from "@/hooks/useLocations";
import { getStoredPinColor, storeAvatarUrl } from "@/lib/identity";
import { PIN_COLORS } from "@/lib/colors";
import { getInitials } from "@/lib/colors";
import { getRoleForVoter } from "@/lib/roles";
import { getSupabase } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/storage";
import { TabBar, ProfileHero } from "@hoppz-ui";
import { AvatarCropper } from "@/components/AvatarCropper";
import { Icon } from "@/components/Icon";
import { RoleBadge } from "@/components/RoleBadge";
import { TripStatusCard } from "./TripStatusCard";
import { VoteCard } from "./VoteCard";
import { AvailabilityCard } from "./AvailabilityCard";
import { LocationCard } from "./LocationCard";
import { NotificationsCard } from "./NotificationsCard";
import { IdentityCard } from "./IdentityCard";
import { RoleCard } from "./RoleCard";
import { NotesSection } from "./NotesSection";
import { IdentityGate } from "./IdentityGate";
import { SwitchIdentityRow } from "./SwitchIdentityRow";

type ProfileTab = "me" | "trip" | "about";

export function ProfileBody({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { voterId, name, voters, updateProfile, signOut } = useGroupData();
  const locations = useLocations();
  const [activeTab, setActiveTab] = useState<ProfileTab>("me");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [secure, setSecure] = useState<{ pinHash: string | null; createdAt: string | null } | null>(
    null,
  );
  const loadSecure = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !voterId) {
      setSecure({ pinHash: null, createdAt: null });
      return;
    }
    try {
      const { data, error } = await sb
        .from("v2_voters")
        .select("pin_hash,created_at")
        .eq("voter_id", voterId)
        .maybeSingle();
      if (error) throw error;
      setSecure({
        pinHash: (data?.pin_hash as string | null) ?? null,
        createdAt: (data?.created_at as string | null) ?? null,
      });
    } catch {
      setSecure({ pinHash: null, createdAt: null });
    }
  }, [voterId]);

  useEffect(() => {
    void loadSecure();
  }, [loadSecure]);

  const handleSave = useCallback(
    async (changes: { displayName?: string; pin?: string }) => {
      await updateProfile(changes);
      if (changes.pin) await loadSecure();
    },
    [updateProfile, loadSecure],
  );

  if (!name) return <IdentityGate />;

  const myRow = voters.find((v) => v.voter_id === voterId);
  const displayName = (myRow?.display_name ?? myRow?.name ?? name).trim();
  const pinColor = myRow?.pin_color ?? getStoredPinColor() ?? PIN_COLORS[0];
  const spaceIdx = displayName.lastIndexOf(" ");
  const storedFirst = spaceIdx > 0 ? displayName.slice(0, spaceIdx) : displayName;
  const storedInitial = spaceIdx > 0 ? displayName.slice(spaceIdx + 1) : "";
  const memberSince = secure?.createdAt
    ? new Date(secure.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const role = getRoleForVoter(voterId, myRow?.role ?? null);

  const handleAvatarTap = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    if (e.target) e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    const result = await uploadAvatar(blob, voterId);
    if (result.ok) {
      storeAvatarUrl(result.url);
      await updateProfile({ avatar_url: result.url });
    }
    setUploading(false);
  };

  return (
    <>
      <TabBar
        tabs={[{id: "me", label: "Me"}, {id: "trip", label: "Trip"}, {id: "about", label: "About"}]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as ProfileTab)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-6">
          {activeTab === "me" && (
            <>
              {/* Avatar section */}
              <ProfileHero
                initials={getInitials(displayName)}
                name={displayName}
                subtitle={memberSince ? `Member since ${memberSince}` : ""}
                avatarColor={pinColor}
                avatarUrl={myRow?.avatar_url ?? undefined}
                onEditPhoto={handleAvatarTap}
                centered
              />
              {role && (
                <div className="flex justify-center">
                  <RoleBadge role={role} size="md" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />

              {role && <RoleCard role={role} />}

              <IdentityCard
                storedFirst={storedFirst}
                storedInitial={storedInitial}
                pinHash={secure === null ? undefined : secure.pinHash}
                onSave={handleSave}
              />

              <SwitchIdentityRow
                displayName={displayName}
                onConfirm={() => {
                  signOut();
                  onClose();
                }}
              />
            </>
          )}

          {activeTab === "trip" && (
            <>
              <TripStatusCard />
              <VoteCard onGoVote={() => onNavigate("/plan/cities")} />
              <AvailabilityCard onMarkDates={() => onNavigate("/plan/calendar")} />
              <LocationCard locations={locations} />
              <NotificationsCard />
            </>
          )}

          {activeTab === "about" && <NotesSection voterId={voterId} />}
        </div>
      </div>

      {cropFile && (
        <AvatarCropper
          imageFile={cropFile}
          onConfirm={(blob) => void handleCropConfirm(blob)}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}
