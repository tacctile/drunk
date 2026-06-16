"use client";

import React from "react";

export type Tab = {
  id: string;
  label: string;
};

export type TabBarProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  sticky?: boolean;
  stickyOffset?: number;
  activeColor?: string;
};

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  sticky = false,
  stickyOffset,
  activeColor = "border-primary text-primary",
}: TabBarProps) {
  const stickyClass = sticky ? "sticky z-50 bg-surface shadow-md" : "";

  return (
    <nav
      className={`flex border-b border-outline-variant px-margin-mobile ${stickyClass}`}
      style={sticky && stickyOffset != null ? { top: stickyOffset } : undefined}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={[
              "flex-1 py-4 text-center font-label-sm text-label-sm uppercase tracking-wider border-b-2 transition-all duration-300",
              isActive
                ? activeColor
                : "border-transparent text-on-surface-variant",
            ].join(" ")}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
