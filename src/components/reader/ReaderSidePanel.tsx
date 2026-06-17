"use client";

import type { ReactNode } from "react";

interface ReaderSidePanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  chrome: { shell: string; border: string; text: string };
}

export function ReaderSidePanel({
  open,
  title,
  onClose,
  children,
  chrome,
}: ReaderSidePanelProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col shadow-xl"
        style={{ background: chrome.shell, color: chrome.text, borderLeft: `1px solid ${chrome.border}` }}
      >
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${chrome.border}` }}
        >
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
