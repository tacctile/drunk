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
};

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="flex border-b border-white/5 px-margin-mobile bg-[#202124]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={[
              "flex-1 py-4 text-center font-label-sm text-label-sm border-b-2 transition-all duration-300",
              isActive
                ? "border-primary text-primary"
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
