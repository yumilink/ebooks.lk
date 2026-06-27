"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReaderBookmark, ReaderPreferences, TocEntry } from "@/lib/reader/types";
import { FONT_FAMILY_OPTIONS, FONT_SIZE_STEPS } from "@/lib/reader/types";
import { ReaderSidePanel } from "@/components/reader/ReaderSidePanel";
import { THEME_CHROME } from "@/lib/reader/epub-themes";

export type ReaderPanel = "toc" | "bookmarks" | "settings" | null;

interface ReaderToolbarProps {
  bookTitle: string;
  backHref: string;
  panel: ReaderPanel;
  onPanelChange: (panel: ReaderPanel) => void;
  prefs: ReaderPreferences;
  onPrefsChange: (prefs: ReaderPreferences) => void;
  toc: TocEntry[];
  bookmarks: ReaderBookmark[];
  currentHref?: string;
  progress: number;
  onTocSelect: (href: string) => void;
  onBookmarkAdd: () => void;
  onBookmarkGo: (cfi: string) => void;
  onBookmarkRemove: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  remainingLabel: string;
}

export function ReaderToolbar({
  bookTitle,
  backHref,
  panel,
  onPanelChange,
  prefs,
  onPrefsChange,
  toc,
  bookmarks,
  currentHref,
  progress,
  onTocSelect,
  onBookmarkAdd,
  onBookmarkGo,
  onBookmarkRemove,
  onPrev,
  onNext,
  remainingLabel,
}: ReaderToolbarProps) {
  const chrome = THEME_CHROME[prefs.theme];
  const [menuOpen, setMenuOpen] = useState(false);

  const openPanel = (id: ReaderPanel) => {
    setMenuOpen(false);
    onPanelChange(panel === id ? null : id);
  };

  const pct = Math.round(progress);

  return (
    <>
      {/* Minimal top chrome — sits above the page content */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20"
        style={{ color: chrome.text }}
      >
        <div
          className="pointer-events-auto flex h-9 items-center gap-2 px-2 backdrop-blur-sm"
          style={{
            background: `${chrome.header}e6`,
            borderBottom: `1px solid ${chrome.border}`,
          }}
        >
          <Link
            href={backHref}
            className="max-w-[40%] truncate text-xs opacity-70 hover:opacity-100"
            title={bookTitle}
          >
            ← {bookTitle || "Back"}
          </Link>

          <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: "#b45309" }}>
            {pct}%
          </span>

          <span className="hidden text-[10px] opacity-50 sm:inline">{remainingLabel}</span>

          <button
            type="button"
            aria-label="Reader menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md border px-2 py-0.5 text-sm leading-none"
            style={{ borderColor: chrome.border }}
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="pointer-events-auto fixed inset-0 z-20 bg-black/10"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="pointer-events-auto absolute right-2 top-10 z-30 min-w-[10rem] overflow-hidden rounded-lg border shadow-lg"
              style={{
                background: chrome.shell,
                borderColor: chrome.border,
              }}
            >
              <MenuItem onClick={() => openPanel("toc")} active={panel === "toc"} chrome={chrome}>
                Contents
              </MenuItem>
              <MenuItem
                onClick={() => openPanel("bookmarks")}
                active={panel === "bookmarks"}
                chrome={chrome}
              >
                Bookmarks
              </MenuItem>
              <MenuItem
                onClick={() => openPanel("settings")}
                active={panel === "settings"}
                chrome={chrome}
              >
                Display (Aa)
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuOpen(false);
                  onBookmarkAdd();
                }}
                chrome={chrome}
              >
                + Add bookmark
              </MenuItem>
            </div>
          </>
        )}

        <div className="h-0.5" style={{ background: chrome.border }}>
          <div
            className="h-full bg-amber-600 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Side page-turn controls — mobile: sit in side gutters; desktop: margin outside text */}
      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrev}
        className="absolute top-1/2 z-30 flex -translate-y-1/2 items-center justify-center bg-amber-600 text-white shadow-md transition active:scale-95 active:bg-amber-700 max-md:left-0 max-md:h-14 max-md:w-9 max-md:rounded-r-lg max-md:text-2xl md:left-2 md:h-9 md:w-9 md:rounded-full md:text-xl md:opacity-90 md:hover:bg-amber-500 md:hover:opacity-100"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next page"
        onClick={onNext}
        className="absolute top-1/2 z-30 flex -translate-y-1/2 items-center justify-center bg-amber-600 text-white shadow-md transition active:scale-95 active:bg-amber-700 max-md:right-0 max-md:h-14 max-md:w-9 max-md:rounded-l-lg max-md:text-2xl md:right-2 md:h-9 md:w-9 md:rounded-full md:text-xl md:opacity-90 md:hover:bg-amber-500 md:hover:opacity-100"
      >
        ›
      </button>

      <ReaderSidePanel
        open={panel === "toc"}
        title="Table of contents"
        onClose={() => onPanelChange(null)}
        chrome={chrome}
      >
        {toc.length === 0 ? (
          <p className="p-4 text-sm opacity-70">No chapters found in this book.</p>
        ) : (
          <ul className="py-2">
            {toc.map((entry) => {
              const active =
                currentHref &&
                (currentHref === entry.href ||
                  currentHref.endsWith(entry.href) ||
                  entry.href.endsWith(currentHref));
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onTocSelect(entry.href);
                      onPanelChange(null);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:opacity-80"
                    style={{
                      paddingLeft: `${1 + entry.depth * 0.75}rem`,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#b45309" : chrome.text,
                    }}
                  >
                    {entry.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ReaderSidePanel>

      <ReaderSidePanel
        open={panel === "bookmarks"}
        title="Bookmarks"
        onClose={() => onPanelChange(null)}
        chrome={chrome}
      >
        {bookmarks.length === 0 ? (
          <p className="p-4 text-sm opacity-70">
            Use the menu → <strong>Add bookmark</strong> to save your place.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: chrome.border }}>
            {bookmarks.map((bm) => (
              <li key={bm.id} className="flex items-start gap-2 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left text-sm hover:opacity-80"
                  onClick={() => {
                    onBookmarkGo(bm.cfi);
                    onPanelChange(null);
                  }}
                >
                  <span className="font-medium">{bm.label}</span>
                  <span className="mt-0.5 block text-xs opacity-60">
                    {new Date(bm.createdAt).toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove bookmark"
                  className="shrink-0 px-2 text-xs opacity-50 hover:opacity-100"
                  onClick={() => onBookmarkRemove(bm.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </ReaderSidePanel>

      <ReaderSidePanel
        open={panel === "settings"}
        title="Reading settings"
        onClose={() => onPanelChange(null)}
        chrome={chrome}
      >
        <div className="space-y-6 p-4 text-sm">
          <section>
            <p className="mb-2 font-medium">Theme</p>
            <div className="flex gap-2">
              {(["light", "sepia", "dark"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => onPrefsChange({ ...prefs, theme })}
                  className="flex-1 rounded-md border px-3 py-2 capitalize"
                  style={{
                    borderColor: prefs.theme === theme ? "#b45309" : chrome.border,
                    background: THEME_CHROME[theme].shell,
                    color: THEME_CHROME[theme].text,
                    fontWeight: prefs.theme === theme ? 600 : 400,
                  }}
                >
                  {theme}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 font-medium">Font size — {prefs.fontSize}%</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border px-3 py-1"
                style={{ borderColor: chrome.border }}
                onClick={() => {
                  const idx = FONT_SIZE_STEPS.indexOf(
                    prefs.fontSize as (typeof FONT_SIZE_STEPS)[number]
                  );
                  const next = FONT_SIZE_STEPS[Math.max(0, idx - 1)] ?? FONT_SIZE_STEPS[0];
                  onPrefsChange({ ...prefs, fontSize: next });
                }}
              >
                A−
              </button>
              <input
                type="range"
                min={0}
                max={FONT_SIZE_STEPS.length - 1}
                value={Math.max(
                  0,
                  FONT_SIZE_STEPS.indexOf(prefs.fontSize as (typeof FONT_SIZE_STEPS)[number])
                )}
                onChange={(e) => {
                  const step = FONT_SIZE_STEPS[Number(e.target.value)] ?? 100;
                  onPrefsChange({ ...prefs, fontSize: step });
                }}
                className="flex-1"
              />
              <button
                type="button"
                className="rounded-md border px-3 py-1"
                style={{ borderColor: chrome.border }}
                onClick={() => {
                  const idx = FONT_SIZE_STEPS.indexOf(
                    prefs.fontSize as (typeof FONT_SIZE_STEPS)[number]
                  );
                  const next =
                    FONT_SIZE_STEPS[Math.min(FONT_SIZE_STEPS.length - 1, idx + 1)] ??
                    FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1];
                  onPrefsChange({ ...prefs, fontSize: next });
                }}
              >
                A+
              </button>
            </div>
          </section>

          <section>
            <p className="mb-2 font-medium">Font</p>
            <div className="flex flex-col gap-2">
              {FONT_FAMILY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPrefsChange({ ...prefs, fontFamily: opt.value })}
                  className="rounded-md border px-3 py-2 text-left"
                  style={{
                    borderColor: prefs.fontFamily === opt.value ? "#b45309" : chrome.border,
                    fontFamily: opt.value,
                    fontWeight: prefs.fontFamily === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 font-medium">Layout</p>
            <div className="flex gap-2">
              {(
                [
                  { id: "paginated", label: "Pages" },
                  { id: "scrolled", label: "Scroll" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onPrefsChange({ ...prefs, flow: opt.id })}
                  className="flex-1 rounded-md border px-3 py-2"
                  style={{
                    borderColor: prefs.flow === opt.id ? "#b45309" : chrome.border,
                    fontWeight: prefs.flow === opt.id ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs opacity-60">
              Layout changes apply when you reopen the book.
            </p>
          </section>
        </div>
      </ReaderSidePanel>
    </>
  );
}

function MenuItem({
  children,
  onClick,
  active,
  chrome,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  chrome: { border: string; text: string };
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full border-b px-4 py-2.5 text-left text-sm last:border-b-0 hover:opacity-80"
      style={{
        borderColor: chrome.border,
        color: active ? "#b45309" : chrome.text,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
