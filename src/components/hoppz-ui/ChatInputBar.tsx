"use client";

import React, { useRef, useCallback } from "react";

export type ChatInputAction = {
  icon: string;
  ariaLabel: string;
  onClick?: () => void;
};

export type ChatInputBarProps = {
  placeholder?: string;
  leadingActions?: ChatInputAction[];
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
};

export function ChatInputBar({
  placeholder = "Message...",
  leadingActions,
  value,
  onChange,
  onSend,
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
      handleInput();
    },
    [onChange, handleInput],
  );

  const handleSend = useCallback(() => {
    if (!value?.trim()) return;
    onSend?.();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="bg-surface-container-high px-margin-mobile py-3 border-t border-white/[0.07] shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-end gap-sm max-w-4xl mx-auto">
        {leadingActions?.map((action) => (
          <button
            key={action.icon}
            type="button"
            className="w-[44px] h-[44px] flex items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity"
            onClick={action.onClick}
            aria-label={action.ariaLabel}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
          </button>
        ))}
        <div className="flex-1 bg-surface-variant rounded-xl flex items-center px-4 py-2 min-h-[44px] focus-within:ring-2 ring-primary transition-all">
          <textarea
            ref={textareaRef}
            className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-body-md text-body-md resize-none py-1 h-auto max-h-[120px]"
            placeholder={placeholder}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          type="button"
          className="w-[40px] h-[40px] rounded-full bg-electric-lime flex items-center justify-center text-dark-icon active:scale-95 transition-all shadow-lg"
          onClick={handleSend}
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[24px]">send</span>
        </button>
      </div>
    </div>
  );
}
