"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Copy,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/lib/settings-store";
import { useAuthStore } from "@/lib/store";
import { createBellaEngine, matchIntent } from "@/lib/bella-engine";
import {
  bellaSearchUrl,
  formatBellaPrice,
  parseBellaSearch,
  type BellaSearch,
} from "@/lib/bella-search";
import { findBellaListings } from "@/lib/bella-listings";
import type { Listing } from "@/lib/types/database";
import {
  bellaFeatureGroups,
  bellaFeatureCount,
  type BellaFeature,
} from "@/lib/bella-features";
import "./bella-chat.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  listings?: Listing[];
  searchUrl?: string;
  retry?: string;
}
const welcome = "Hi, I'm Bella. Let's find what you're looking for.";
const initialMessages = (): Message[] => [
  { id: "welcome", role: "assistant", content: welcome },
];

function messageContent(text: string) {
  return text
    .split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)
    .map((part, index) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const [, label, href] = link;
        if (
          href.startsWith("/") &&
          !href.startsWith("//") &&
          !href.includes("\\")
        )
          return (
            <Link key={index} href={href}>
              {label}
            </Link>
          );
        if (/^(https?:|mailto:|tel:)/i.test(href))
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          );
        return label;
      }
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      return part;
    });
}

export function BellaChat() {
  const [open, setOpen] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const introSeenRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState<BellaSearch>({});
  const [shortlist, setShortlist] = useState<Listing[]>([]);
  const [comparing, setComparing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const busyRef = useRef(false);
  const filtersRef = useRef<BellaSearch>({});
  const draftingRef = useRef(false);
  const { t, i18n } = useTranslation();
  const { setTheme } = useTheme();
  const settings = useSettingsStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const storageKey = `bella-session-v2:${user?.uid || "guest"}`;

  // Introduce Bella once per tab, after onboarding, without opening the chat.
  useEffect(() => {
    const introKey = "bella-introduction-seen-v1";
    const remember = () => {
      introSeenRef.current = true;
      try {
        sessionStorage.setItem(introKey, "true");
      } catch {
        /* Optional storage. */
      }
    };
    if (open) {
      remember();
      setIntroVisible(false);
      return;
    }
    if (
      loadedKey !== storageKey ||
      !settings.hasSeenOnboarding ||
      introSeenRef.current
    )
      return;
    try {
      if (sessionStorage.getItem(introKey)) return;
    } catch {
      /* Use the in-memory flag. */
    }
    const showTimer = setTimeout(() => {
      remember();
      setIntroVisible(true);
    }, 1200);
    return () => {
      clearTimeout(showTimer);
    };
  }, [open, loadedKey, storageKey, settings.hasSeenOnboarding]);

  useEffect(() => {
    if (!introVisible) return;
    const hideTimer = setTimeout(() => setIntroVisible(false), 7000);
    return () => clearTimeout(hideTimer);
  }, [introVisible]);

  // Keep each account's conversation separate and retain it only in this browser tab.
  useEffect(() => {
    requestRef.current++;
    busyRef.current = false;
    setBusy(false);
    setShortlist([]);
    setComparing(false);
    setInput("");
    setDrafting(false);
    draftingRef.current = false;
    let history = initialMessages();
    let search: BellaSearch = {};
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved && Array.isArray(saved.messages)) {
        history = saved.messages
          .filter(
            (m: Message) =>
              m &&
              typeof m.id === "string" &&
              ["user", "assistant"].includes(m.role) &&
              typeof m.content === "string",
          )
          .slice(-60)
          .map((m: Message) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            retry: typeof m.retry === "string" ? m.retry : undefined,
          }));
        if (!history.length) history = initialMessages();
        if (saved.filters && typeof saved.filters === "object")
          search = saved.filters;
      }
    } catch {
      /* Storage may be disabled or contain an older format. */
    }
    setMessages(history);
    setFilters(search);
    filtersRef.current = search;
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      // Do not persist listing snapshots; search results are fetched live.
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          messages: messages.slice(-60).map(({ id, role, content, retry }) => ({
            id,
            role,
            content,
            retry,
          })),
          filters,
        }),
      );
    } catch {
      /* The chat still works when browser storage is unavailable. */
    }
  }, [messages, filters, storageKey, loadedKey]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (showFeatures) {
      const transcript = panelRef.current?.querySelector(".bella-transcript");
      if (transcript) transcript.scrollTop = 0;
    } else
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [messages, busy, comparing, showFeatures, open]);
  useEffect(
    () => () => {
      requestRef.current++;
    },
    [],
  );

  function newChat() {
    requestRef.current++;
    busyRef.current = false;
    setBusy(false);
    setMessages(initialMessages());
    setShowFeatures(false);
    setFilters({});
    filtersRef.current = {};
    setShortlist([]);
    setComparing(false);
    setDrafting(false);
    draftingRef.current = false;
    setInput("");
    setNotice("");
    inputRef.current?.focus();
  }

  async function send(raw: string) {
    const text = raw.trim().slice(0, 2000);
    if (!text || busyRef.current) return;
    if (
      /^(?:all features|show (?:all )?features|what can you do\??|capabilities)$/i.test(
        text,
      )
    ) {
      setShowFeatures(true);
      setInput("");
      return;
    }
    setShowFeatures(false);
    busyRef.current = true;
    const request = ++requestRef.current;
    const id = crypto.randomUUID();
    setMessages((prev) =>
      [...prev, { id, role: "user" as const, content: text }].slice(-60),
    );
    setInput("");
    setBusy(true);
    setNotice("");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const resolve = async (): Promise<Omit<Message, "id" | "role">> => {
        if (/^(cancel|stop)( draft| drafting)?$/i.test(text)) {
          draftingRef.current = false;
          setDrafting(false);
          return {
            content: "Draft cancelled. What would you like help with next?",
          };
        }
        if (
          /\b(draft|write|create)\b.*\b(listing|description|ad)\b|\blisting draft\b/i.test(
            text,
          )
        ) {
          draftingRef.current = true;
          setDrafting(true);
          return {
            content:
              "Let's create your listing. Send the property type, location, asking price, size and the features you want to highlight in one message. I'll turn those details into an editable draft. Please leave out private contact details. Type 'cancel' to stop.",
          };
        }
        if (draftingRef.current) {
          draftingRef.current = false;
          setDrafting(false);
          const details = text
            .split(/[,;\n]+/)
            .map((part) => part.trim())
            .filter(Boolean);
          const title = details[0].slice(0, 100);
          return {
            content: `Your listing draft\n\n**Title**\n${title}\n\n**Description**\nAvailable on BhoomiTayi: ${details[0]}. ${details.slice(1).join(". ")}${details.length > 1 ? "." : ""}\n\n**Owner-provided highlights**\n${details.map((detail) => `- ${detail}`).join("\n")}\n\nInterested? Contact the owner through this listing to confirm availability and arrange a visit.\n\nBefore publishing, check the price, size, address and photos. Add any missing details. This draft only uses the information you supplied.\n\n[Create your listing](/sell)`,
          };
        }
        if (/\b(compare|shortlist)\b/i.test(text)) {
          setComparing(true);
          return {
            content:
              shortlist.length >= 2
                ? "Your comparison is ready above. Prices and details come from the listings; confirm availability and terms with the owners."
                : "Add two or three listings using the Compare button on search results. Then I can show their asking prices, locations and property details side by side.",
          };
        }
        const search = parseBellaSearch(text, filtersRef.current);
        if (search) {
          filtersRef.current = search;
          setFilters(search);
          if (!search.category)
            return {
              content:
                "Search filters cleared. What are you looking for: a house, land, PG, commercial space, vehicle or commodity?",
            };
          const { listings, sampled } = await findBellaListings(search);
          const details = [
            search.location,
            search.bedrooms ? `${search.bedrooms} BHK` : "",
            search.maxPrice ? `under ${formatBellaPrice(search.maxPrice)}` : "",
            search.transaction,
          ]
            .filter(Boolean)
            .join(" · ");
          return {
            content: listings.length
              ? `Here are ${listings.length} matching listings${details ? ` · ${details}` : ""}.\n${sampled ? "I searched a limited batch of active listings. Browse the category for more options." : "You can refine this search by location, budget or BHK, or compare up to three options."}`
              : `I couldn't find a match${details ? ` · ${details}` : ""}${sampled ? " in the batch searched" : ""}. Try a nearby area, 'any budget' or 'any BHK'. You can also browse the category below.`,
            listings,
            searchUrl: bellaSearchUrl(search),
          };
        }
        if (/^(help|what can you do\??|show me around)$/i.test(text))
          return {
            content:
              "I can help you with:\n\n- Live listing search: '2 BHK houses in Bangalore under 80 lakh'\n- Follow-ups: 'only for rent', 'under 25k', 'near Whitefield'\n- Compare up to three listings using their Compare buttons\n- Draft a listing from details you provide\n- Open EMI, area and other calculators\n- Change theme, font size and website language\n- Navigate BhoomiTayi and explain how to list\n\nSearch and guided help work without a paid AI account. General answers are currently in English; website language commands support six languages.",
          };
        const intents = createBellaEngine(
          setTheme,
          (language) => {
            void i18n.changeLanguage(language);
          },
          settings,
          user,
          router,
        );
        const result = await matchIntent(text, intents, t);
        if (request !== requestRef.current) return { content: "" };
        result.action?.();
        if (
          settings.activeCalculator !==
            useSettingsStore.getState().activeCalculator ||
          useSettingsStore.getState().isSettingsOpen
        )
          setOpen(false);
        const fallback = t("bella.fallback");
        return {
          content:
            result.response === fallback
              ? "I didn't quite understand that. Try a property type, location and budget, or choose a suggestion below. For account or payment help, visit [Contact support](/contact)."
              : result.response,
        };
      };
      const reply = await Promise.race([
        resolve(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), 15000);
        }),
      ]);
      if (request === requestRef.current)
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", ...reply },
        ]);
    } catch {
      if (request === requestRef.current)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I couldn't complete that request. Check your connection and try again. Your search filters are still here.",
            retry: text,
          },
        ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (request === requestRef.current) {
        busyRef.current = false;
        setBusy(false);
        inputRef.current?.focus();
      }
    }
  }

  async function copy(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(message.id);
    } catch {
      setNotice(
        "Copy is unavailable in this browser. You can select the response text instead.",
      );
    }
  }
  function download() {
    const blob = new Blob(
      [
        messages
          .map((m) => `${m.role === "user" ? "You" : "Bella"}: ${m.content}`)
          .join("\n\n"),
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bella-conversation.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function toggleListing(listing: Listing) {
    if (shortlist.some((item) => item.id === listing.id)) {
      setShortlist((prev) => prev.filter((item) => item.id !== listing.id));
      return;
    }
    if (shortlist.length === 3) {
      setNotice(
        "You can compare up to three listings. Remove one to add another.",
      );
      return;
    }
    setShortlist((prev) => [...prev, listing]);
    setNotice("");
  }

  function runFeature(feature: BellaFeature) {
    if (feature.calculator) {
      settings.setActiveCalculator(feature.calculator);
      setOpen(false);
      return;
    }
    if (feature.prompt) {
      void send(feature.prompt);
      return;
    }
    switch (feature.action) {
      case "new":
        newChat();
        break;
      case "download":
        download();
        break;
      case "expand":
        setExpanded((value) => !value);
        break;
      case "copy": {
        const reply = [...messages]
          .reverse()
          .find(
            (message) =>
              message.role === "assistant" && message.id !== "welcome",
          );
        if (reply) {
          void copy(reply);
          setShowFeatures(false);
        } else
          setNotice("Send a message first, then you can copy Bella's reply.");
        break;
      }
      case "retry": {
        const request = [...messages]
          .reverse()
          .find((message) => message.role === "user");
        if (request) void send(request.content);
        else setNotice("Send a message first, then you can retry it here.");
        break;
      }
      case "clear-filters":
        setFilters({});
        filtersRef.current = {};
        setNotice("Search filters cleared.");
        break;
      case "clear-shortlist":
        setShortlist([]);
        setComparing(false);
        setNotice("Comparison shortlist cleared.");
        break;
      case "close":
        close();
        break;
    }
  }

  // Reveal controls after hydration and account-specific history have loaded.
  if (loadedKey !== storageKey) return null;

  return (
    <div id="bella-chat-root">
      {introVisible && !open && (
        <aside className="bella-introduction" aria-label="Bella introduction">
          <button
            className="bella-introduction-dismiss"
            aria-label="Dismiss Bella introduction"
            onClick={() => setIntroVisible(false)}
          >
            <X size={14} />
          </button>
          <button
            className="bella-introduction-message"
            onClick={() => {
              setIntroVisible(false);
              setShowFeatures(false);
              setOpen(true);
            }}
          >
            <span role="status">
              <strong>
                Hi, I&apos;m Bella AI! <Sparkles size={14} />
              </strong>
              <span>
                I can help you find listings, compare options, use calculators
                and more.
              </span>
            </span>
            <span className="bella-introduction-cta">
              How can I help? <ArrowUpRight size={13} />
            </span>
          </button>
        </aside>
      )}
      <button
        ref={launcherRef}
        id="bella-chat-button"
        className="bella-launcher"
        aria-label="Open Bella assistant"
        title="Open Bella"
        aria-expanded={open}
        aria-controls="bella-panel"
        onClick={() => {
          setIntroVisible(false);
          setShowFeatures(false);
          setOpen((value) => !value);
        }}
        hidden={open}
      >
        <span className="bella-launcher-avatar">
          <Image src="/bella-avatar.jpg" alt="" width={44} height={44} />
        </span>
      </button>
      {open && (
        <section
          ref={panelRef}
          id="bella-panel"
          className={`bella-panel ${expanded ? "bella-expanded" : ""}`}
          role="dialog"
          aria-label="Bella assistant"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
            if (event.key === "Tab") {
              const focusable = Array.from(
                panelRef.current?.querySelectorAll<HTMLElement>(
                  "button:not([disabled]), a[href], textarea, input, select",
                ) || [],
              ).filter((el) => el.getClientRects().length);
              const first = focusable[0],
                last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
              }
            }
          }}
        >
          <header className="bella-header">
            <div className="bella-brand">
              <span className="bella-avatar">
                <Image src="/bella-avatar.jpg" alt="" width={44} height={44} />
                <i />
              </span>
              <div>
                <h2>
                  Bella <span>ASSISTANT</span>
                </h2>
                <p>Find a place. Make your next move.</p>
              </div>
            </div>
            <div className="bella-tools">
              <button
                aria-label="New conversation"
                title="New conversation"
                onClick={newChat}
              >
                <Plus size={18} />
              </button>
              <button
                aria-label="Download conversation"
                title="Download conversation"
                onClick={download}
              >
                <ArrowDownToLine size={17} />
              </button>
              <button
                className="bella-expand-button"
                aria-label={expanded ? "Compact chat" : "Expand chat"}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
              <button aria-label="Close Bella" onClick={close}>
                <X size={19} />
              </button>
            </div>
          </header>
          <div className="bella-context">
            <span>
              <i /> Guided help & live listing search
            </span>
            <button
              onClick={() => setShowFeatures((value) => !value)}
              aria-expanded={showFeatures}
              aria-controls="bella-feature-directory"
              disabled={busy}
            >
              {showFeatures
                ? "Back to chat"
                : `All ${bellaFeatureCount} features`}{" "}
              <ArrowUpRight size={12} />
            </button>
          </div>
          <div
            className="bella-transcript"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-busy={busy}
          >
            {showFeatures && (
              <div
                id="bella-feature-directory"
                className="bella-feature-directory"
              >
                <div className="bella-feature-heading">
                  <Sparkles size={18} />
                  <div>
                    <h3>Everything Bella can do</h3>
                    <p>
                      All {bellaFeatureCount} features. Pick any option below.
                    </p>
                  </div>
                </div>
                {bellaFeatureGroups.map((group) => (
                  <section
                    key={group.title}
                    className="bella-feature-group"
                    aria-label={group.title}
                  >
                    <h4>
                      {group.title}
                      <span>{group.features.length}</span>
                    </h4>
                    <div className="bella-feature-grid">
                      {group.features.map((feature) =>
                        feature.href ? (
                          <Link
                            key={feature.label}
                            href={feature.href}
                            onClick={() => setOpen(false)}
                          >
                            {feature.label}
                            <ArrowUpRight size={12} />
                          </Link>
                        ) : (
                          <button
                            key={feature.label}
                            disabled={busy}
                            onClick={() => runFeature(feature)}
                          >
                            {feature.label}
                            <ArrowUpRight size={12} />
                          </button>
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
            <div hidden={showFeatures}>
              {shortlist.length > 0 && (
                <div className="bella-shortlist">
                  <span>{shortlist.length}/3 shortlisted</span>
                  <button onClick={() => setComparing((value) => !value)}>
                    {comparing ? "Hide comparison" : "Compare listings"}
                  </button>
                  <button
                    aria-label="Clear shortlist"
                    onClick={() => {
                      setShortlist([]);
                      setComparing(false);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {comparing && shortlist.length > 0 && (
                <div className="bella-comparison">
                  <table>
                    <caption>Your listing comparison</caption>
                    <thead>
                      <tr>
                        <th>Detail</th>
                        {shortlist.map((item) => (
                          <th key={item.id}>
                            <Link
                              href={`/listing/${encodeURIComponent(item.id)}`}
                            >
                              {item.title}
                            </Link>
                            <button
                              aria-label={`Remove ${item.title} from comparison`}
                              onClick={() => toggleListing(item)}
                            >
                              <X size={13} />
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Asking price",
                        "Location",
                        "Category",
                        "Transaction",
                        "Bedrooms",
                        "Area (sq ft)",
                      ].map((label, index) => (
                        <tr key={label}>
                          <th>{label}</th>
                          {shortlist.map((item) => {
                            const details =
                              item.details &&
                              typeof item.details === "object" &&
                              !Array.isArray(item.details)
                                ? item.details
                                : {};
                            const values = [
                              formatBellaPrice(item.price),
                              item.address || "Not provided",
                              item.category,
                              item.transaction_type,
                              details.bedrooms,
                              details.area_sqft,
                            ];
                            return (
                              <td key={item.id}>
                                {String(values[index] ?? "Not provided")}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`bella-message bella-${message.role}`}
                  data-role={message.role}
                >
                  <div className="bella-message-label">
                    {message.role === "user" ? (
                      "YOU"
                    ) : (
                      <>
                        <Sparkles size={12} /> BELLA
                      </>
                    )}
                  </div>
                  <div className="bella-bubble">
                    {messageContent(message.content)}
                  </div>
                  {message.listings && message.listings.length > 0 && (
                    <div className="bella-results">
                      {message.listings.map((listing) => (
                        <div className="bella-listing" key={listing.id}>
                          <span className="bella-listing-category">
                            {listing.category} / {listing.transaction_type}
                          </span>
                          <Link
                            className="bella-listing-title"
                            href={`/listing/${encodeURIComponent(listing.id)}`}
                          >
                            {listing.title || "View listing"}
                            <ArrowUpRight size={15} />
                          </Link>
                          <p>{listing.address || "Location not provided"}</p>
                          <div>
                            <strong>
                              {formatBellaPrice(listing.price)}
                              {listing.transaction_type === "rent"
                                ? " / month"
                                : ""}
                            </strong>
                            <button
                              aria-pressed={shortlist.some(
                                (item) => item.id === listing.id,
                              )}
                              onClick={() => toggleListing(listing)}
                            >
                              {shortlist.some(
                                (item) => item.id === listing.id,
                              ) ? (
                                <Check size={13} />
                              ) : (
                                <Plus size={13} />
                              )}{" "}
                              Compare
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.searchUrl && (
                    <Link className="bella-browse" href={message.searchUrl}>
                      Browse this category <ArrowUpRight size={14} />
                    </Link>
                  )}
                  {message.role === "assistant" && message.id !== "welcome" && (
                    <div className="bella-response-tools">
                      <button
                        aria-label="Copy response"
                        onClick={() => void copy(message)}
                      >
                        {copied === message.id ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copied === message.id ? "Copied" : "Copy"}
                      </button>
                      {message.retry && (
                        <button
                          disabled={busy}
                          onClick={() => void send(message.retry!)}
                        >
                          <RotateCcw size={13} /> Try again
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
              {busy && (
                <div className="bella-thinking" role="status">
                  <Loader2 size={15} className="bella-spin" /> Bella is working
                  on it...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <footer className="bella-footer">
            {notice && (
              <p className="bella-notice" role="status">
                {notice}
              </p>
            )}
            {filters.category && (
              <div className="bella-filter-summary">
                <span>
                  {[
                    filters.category,
                    filters.location,
                    filters.maxPrice
                      ? formatBellaPrice(filters.maxPrice) + " max"
                      : "",
                    filters.bedrooms ? `${filters.bedrooms} BHK` : "",
                    filters.transaction,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </span>
                <button
                  aria-label="Clear search filters"
                  disabled={busy}
                  onClick={() => {
                    setFilters({});
                    filtersRef.current = {};
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {drafting && (
              <p className="bella-draft-hint">
                Listing draft: send your details, or type cancel.
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
            >
              <textarea
                ref={inputRef}
                aria-label="Message Bella"
                placeholder={
                  drafting
                    ? "Property type, location, price, features..."
                    : "Ask Bella, or describe your ideal place..."
                }
                value={input}
                maxLength={2000}
                rows={2}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || busy}
              >
                {busy ? (
                  <Loader2 size={18} className="bella-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            <p className="bella-footnote">
              Session saved in this tab. Check listing details with the owner
            </p>
          </footer>
        </section>
      )}
    </div>
  );
}
