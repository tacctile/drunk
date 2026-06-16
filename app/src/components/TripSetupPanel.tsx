"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { cities } from "@/data/cities";
import { useGroupData } from "@/hooks/useGroupData";
import { useTripData } from "@/hooks/useTripData";
import { SectionLabel, Card, StatusPill, TextField, ActionButton } from '@hoppz-ui';

interface TripSetupPanelProps {
  canClear: boolean;
}

export function TripSetupPanel({ canClear }: TripSetupPanelProps) {
  const { voters: groupVoters } = useGroupData();
  const {
    trip,
    hotels,
    effectiveStatus,
    cityName,
    setTripDates,
    setTripCity,
    clearTripDates,
    addHotel,
    removeHotel,
    assignVoterToHotel,
    unassignVoterFromHotel,
  } = useTripData();
  const [hotelInput, setHotelInput] = useState("");
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const startVal = trip?.start_date ?? "";
  const endVal = trip?.end_date ?? "";

  const handleStartChange = (v: string) => {
    setDateError("");
    const end = endVal || v;
    if (v > end) {
      setDateError("End date must be after start date");
      return;
    }
    void setTripDates(v, end);
  };
  const handleEndChange = (v: string) => {
    setDateError("");
    const start = startVal || v;
    if (v < start) {
      setDateError("End date must be after start date");
      return;
    }
    void setTripDates(start, v);
  };

  const handleAddHotel = () => {
    const name = hotelInput.trim();
    if (!name) return;
    void addHotel(name);
    setHotelInput("");
  };

  const activeVoters = groupVoters.filter((v) => v.is_active);

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>Trip setup</SectionLabel>

      <Card>
        <StatusPill
          dot
          dotClassName={effectiveStatus === "active" ? "bg-green" : effectiveStatus === "upcoming" ? "bg-accent" : "bg-on-surface-variant"}
          label={`Status: ${effectiveStatus === "active" ? "Active" : effectiveStatus === "upcoming" ? "Upcoming" : "Planning"}`}
        />
        {(effectiveStatus === "upcoming" || effectiveStatus === "active") && (
          <div className="mt-2 flex flex-col gap-1 text-meta font-normal text-ink-muted">
            {cityName && <p>City: {cityName}</p>}
            {trip?.start_date && <p>Start: {trip.start_date}</p>}
            {trip?.end_date && <p>End: {trip.end_date}</p>}
          </div>
        )}
      </Card>

      {(effectiveStatus === "planning" || effectiveStatus === "upcoming") && (
        <>
          <div className="flex flex-col gap-1">
            <SectionLabel>Destination City</SectionLabel>
            <select
              className="input w-full"
              value={trip?.city_id ?? ""}
              onChange={(e) => {
                if (e.target.value) void setTripCity(e.target.value);
              }}
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <SectionLabel>Trip dates</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="input"
                min={today}
                value={startVal}
                onChange={(e) => handleStartChange(e.target.value)}
                aria-label="Start date"
              />
              <input
                type="date"
                className="input"
                min={today}
                value={endVal}
                onChange={(e) => handleEndChange(e.target.value)}
                aria-label="End date"
              />
            </div>
            {dateError && (
              <p className="text-meta text-red">{dateError}</p>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <SectionLabel>Confirmed Hotels</SectionLabel>
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="!p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setExpandedHotelId((prev) => (prev === hotel.id ? null : hotel.id))
                }
              >
                <span className="text-base text-ink">{hotel.hotel_name}</span>
                {hotel.assignedVoterIds.length > 0 && (
                  <div className="mt-1 flex items-center">
                    {hotel.assignedVoterIds.slice(0, 5).map((vid, i) => {
                      const v = groupVoters.find((gv) => gv.voter_id === vid);
                      if (!v) return null;
                      return (
                        <span key={vid} style={{ marginLeft: i > 0 ? -4 : 0 }}>
                          <Avatar
                            voter={{
                              display_name: v.display_name ?? v.name,
                              name: v.name,
                              pin_color: v.pin_color,
                              avatar_url: v.avatar_url,
                            }}
                            size={20}
                          />
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
              <button
                type="button"
                aria-label={`Remove ${hotel.hotel_name}`}
                onClick={() => void removeHotel(hotel.id)}
                className="flex h-11 w-11 flex-none items-center justify-center text-red"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            {expandedHotelId === hotel.id && (
              <div className="border-t px-4 py-3">
                {activeVoters.map((v) => {
                  const assigned = hotel.assignedVoterIds.includes(v.voter_id);
                  return (
                    <label
                      key={v.voter_id}
                      className="flex h-11 items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => {
                          if (assigned) void unassignVoterFromHotel(v.voter_id, hotel.id);
                          else void assignVoterToHotel(v.voter_id, hotel.id);
                        }}
                        className="h-5 w-5 rounded accent-accent"
                      />
                      <span className="text-base text-ink">
                        {v.display_name ?? v.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField label="Add hotel" value={hotelInput} onChange={setHotelInput} placeholder="Hotel name" />
          </div>
          <button
            type="button"
            onClick={handleAddHotel}
            className="flex h-11 w-11 flex-none items-center justify-center text-accent"
            aria-label="Add hotel"
          >
            <Icon name="add" size={24} />
          </button>
        </div>
      </div>

      {canClear && (effectiveStatus === "upcoming" || effectiveStatus === "active" || startVal) && (
        <>
          {!confirmClear ? (
            <ActionButton label="Clear Trip Dates" variant="ghost" fullWidth onClick={() => setConfirmClear(true)} />
          ) : (
            <Card className="!border !border-red">
              <p className="text-meta font-normal text-ink-muted">
                This will return the trip to planning mode. Votes will unlock.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn flex-1 bg-red text-bg"
                  onClick={() => {
                    void clearTripDates();
                    setConfirmClear(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </Card>
          )}
        </>
      )}

      {(effectiveStatus === "upcoming" || effectiveStatus === "active") && (
        <div className="rounded-card bg-raised p-3 text-meta font-normal text-ink-muted">
          Voting is locked — trip is confirmed.
        </div>
      )}
    </section>
  );
}
