import { useMemo, useState } from "react";
import {
  Menu, Search, SlidersHorizontal, HelpCircle, Settings, Grid3x3, Pencil, Inbox, Star, Clock,
  Send, File, ShieldAlert, Trash2, ChevronDown, RotateCw, MoreVertical, ChevronLeft, ChevronRight,
  ArrowLeft, Archive, Mail, Tag, Users, X, Minus, Maximize2, ShieldCheck, Sparkles, Reply, Forward,
  Paperclip, Smile, Link2, Image as ImageIcon, Lock, Calendar, StickyNote, CheckSquare, Plus,
} from "lucide-react";
import { seedEmails, type Email } from "@/lib/emails";
import { classifyMessage, type Verdict } from "@/lib/classifier";
import { cn } from "@/lib/utils";

type Folder = "inbox" | "starred" | "snoozed" | "sent" | "drafts" | "spam";
type Tab = "primary" | "promotions" | "social";

const avatarColors = ["bg-g-blue", "bg-g-red", "bg-g-green", "bg-g-yellow", "bg-primary", "bg-destructive"];
const colorFor = (s: string) => avatarColors[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

function Logo() {
  return (
    <div className="flex items-center gap-2 pl-1">
      <svg viewBox="0 0 48 36" className="h-7 w-9">
        <path d="M4 34h7V17L0 9v21a4 4 0 0 0 4 4Z" className="fill-g-blue" />
        <path d="M37 34h7a4 4 0 0 0 4-4V9l-11 8Z" className="fill-g-green" />
        <path d="M37 3v14l11-8V5c0-4-4.6-6.3-7.8-3.9Z" className="fill-g-yellow" />
        <path d="M11 17V3l13 9.8L37 3v14L24 26.6Z" className="fill-g-red" />
        <path d="M0 5v4l11 8V3L7.8 1.1C4.6-1.3 0 1 0 5Z" className="fill-destructive" />
      </svg>
      <span className="font-display text-[22px] text-muted-foreground">SpamGuard</span>
    </div>
  );
}

function IconBtn({ children, label, onClick, className }: { children: React.ReactNode; label: string; onClick?: () => void; className?: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className={cn("grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent", className)}>
      {children}
    </button>
  );
}

function VerdictChip({ v, small }: { v?: Verdict | undefined; small?: boolean }) {
  if (!v) return null;
  const spam = v.label === "spam";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-medium",
      small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
      spam ? "bg-danger-soft text-destructive" : "bg-safe-soft text-safe")}>
      {spam ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
      {spam ? "Spam" : "Not spam"} · {Math.round(v.confidence * 100)}%
    </span>
  );
}

export default function MailApp() {
  const [emails, setEmails] = useState<Email[]>(seedEmails);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [tab, setTab] = useState<Tab>("primary");
  const [openId, setOpenId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const counts = {
    inbox: emails.filter((e) => e.folder === "inbox" && e.unread).length,
    spam: emails.filter((e) => e.folder === "spam").length,
  };

  const list = useMemo(() => {
    let l = emails;
    if (folder === "starred") l = l.filter((e) => e.starred);
    else if (folder === "inbox") l = l.filter((e) => e.folder === "inbox" && (query || e.category === tab));
    else if (folder === "spam" || folder === "sent") l = l.filter((e) => e.folder === folder);
    else l = [];
    if (query) {
      const q = query.toLowerCase();
      l = l.filter((e) => (e.from + e.subject + e.body).toLowerCase().includes(q));
    }
    return l;
  }, [emails, folder, tab, query]);

  const open = emails.find((e) => e.id === openId);
  const update = (id: string, p: Partial<Email>) => setEmails((es) => es.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const nav = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: counts.inbox },
    { id: "starred", label: "Starred", icon: Star },
    { id: "snoozed", label: "Snoozed", icon: Clock },
    { id: "sent", label: "Sent", icon: Send },
    { id: "drafts", label: "Drafts", icon: File },
    { id: "spam", label: "Spam", icon: ShieldAlert, count: counts.spam },
  ] as const;

  const rescan = async () => {
    notify("Scanning all messages with the spam model…");
    const results = await Promise.all(emails.map((e) => classifyMessage(`${e.subject}\n${e.body}`)));
    setEmails((es) => es.map((e, i) => ({ ...e, verdict: results[i], folder: e.folder === "sent" ? "sent" : results[i]?.label === "spam" ? "spam" : "inbox" })));
    notify("Scan complete — folders updated");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-2">
        <div className="flex w-[232px] shrink-0 items-center gap-1">
          <IconBtn label="Main menu" onClick={() => setCollapsed((c) => !c)}><Menu className="h-5 w-5" /></IconBtn>
          <Logo />
        </div>
        <div className="mx-2 flex max-w-[720px] flex-1 items-center rounded-full bg-input px-1 transition-shadow focus-within:bg-surface focus-within:shadow-float">
          <IconBtn label="Search"><Search className="h-5 w-5" /></IconBtn>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setOpenId(null); }}
            placeholder="Search mail" className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
          {query && <IconBtn label="Clear" onClick={() => setQuery("")}><X className="h-5 w-5" /></IconBtn>}
          <IconBtn label="Show search options"><SlidersHorizontal className="h-5 w-5" /></IconBtn>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setCheckerOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary md:flex">
            <Sparkles className="h-4 w-4" /> Spam checker
          </button>
          <IconBtn label="Support"><HelpCircle className="h-5 w-5" /></IconBtn>
          <IconBtn label="Settings"><Settings className="h-5 w-5" /></IconBtn>
          <IconBtn label="Apps"><Grid3x3 className="h-5 w-5" /></IconBtn>
          <div className="ml-1 mr-2 grid h-8 w-8 place-items-center rounded-full bg-g-green text-sm font-medium text-primary-foreground">P</div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className={cn("shrink-0 overflow-y-auto pb-4 transition-all duration-200", collapsed ? "w-[72px]" : "w-[256px]")}>
          <div className="px-2 pb-4 pt-1">
            <button onClick={() => setComposeOpen(true)}
              className={cn("flex h-14 items-center gap-3 rounded-2xl bg-compose font-medium text-compose-foreground transition-shadow hover:shadow-row",
                collapsed ? "w-14 justify-center" : "px-5 pr-6")}>
              <Pencil className="h-5 w-5" />{!collapsed && <span className="text-sm">Compose</span>}
            </button>
          </div>
          <nav>
            {nav.map((n) => {
              const active = folder === n.id && !query;
              const Icon = n.icon;
              return (
                <button key={n.id} onClick={() => { setFolder(n.id); setOpenId(null); setQuery(""); setSelected(new Set()); }}
                  className={cn("flex h-8 w-full items-center gap-4 pl-6 pr-3 text-sm transition-colors",
                    collapsed ? "mx-2 w-14 justify-center rounded-full pl-0 pr-0" : "rounded-r-full",
                    active ? "bg-nav-active font-bold text-compose-foreground" : "hover:bg-accent",
                    n.id === "spam" && !active && "text-foreground")}>
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", n.id === "spam" && "text-destructive")} />
                  {!collapsed && <span className="flex-1 text-left">{n.label}</span>}
                  {!collapsed && "count" in n && n.count ? <span className="text-xs font-bold">{n.count}</span> : null}
                </button>
              );
            })}
            {!collapsed && (
              <>
                <button className="flex h-8 w-full items-center gap-4 rounded-r-full pl-6 text-sm hover:bg-accent"><ChevronDown className="h-[18px] w-[18px]" />More</button>
                <div className="mt-4 flex items-center justify-between pl-6 pr-4">
                  <span className="text-base font-medium">Labels</span>
                  <IconBtn label="Create label" className="h-8 w-8"><Plus className="h-4 w-4" /></IconBtn>
                </div>
                {[["ML Project", "bg-g-blue"], ["College", "bg-g-green"], ["Personal", "bg-g-yellow"]].map(([l, c]) => (
                  <div key={l} className="flex h-8 items-center gap-4 rounded-r-full pl-6 text-sm hover:bg-accent">
                    <span className={cn("h-3 w-3 rounded-sm", c)} />{l}
                  </div>
                ))}
                <div className="mx-4 mt-6 rounded-2xl bg-surface p-4 text-sm shadow-row">
                  <div className="mb-1 flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-safe" />Protection active</div>
                  <p className="text-xs text-muted-foreground">{counts.spam} threats caught by your model.</p>
                  <button onClick={rescan} className="mt-3 text-xs font-medium text-primary hover:underline">Re-scan mailbox</button>
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* Main panel */}
        <main className="mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface">
          {open ? (
            <EmailView email={open} onBack={() => setOpenId(null)} update={update} notify={notify} />
          ) : (
            <>
              <div className="flex h-12 shrink-0 items-center gap-1 px-2">
                <label className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent">
                  <input type="checkbox" className="h-4 w-4 accent-primary"
                    checked={list.length > 0 && selected.size === list.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(list.map((l) => l.id)) : new Set())} />
                </label>
                {selected.size > 0 ? (
                  <>
                    <IconBtn label="Archive"><Archive className="h-[18px] w-[18px]" /></IconBtn>
                    <IconBtn label={folder === "spam" ? "Not spam" : "Report spam"} onClick={() => {
                      selected.forEach((id) => update(id, { folder: folder === "spam" ? "inbox" : "spam" }));
                      notify(`${selected.size} conversation(s) ${folder === "spam" ? "moved to Inbox" : "marked as spam"}`); setSelected(new Set());
                    }}><ShieldAlert className="h-[18px] w-[18px]" /></IconBtn>
                    <IconBtn label="Delete" onClick={() => { setEmails((es) => es.filter((e) => !selected.has(e.id))); setSelected(new Set()); notify("Moved to Bin"); }}><Trash2 className="h-[18px] w-[18px]" /></IconBtn>
                    <IconBtn label="Mark as read" onClick={() => { selected.forEach((id) => update(id, { unread: false })); setSelected(new Set()); }}><Mail className="h-[18px] w-[18px]" /></IconBtn>
                  </>
                ) : (
                  <IconBtn label="Refresh / re-scan" onClick={rescan}><RotateCw className="h-[18px] w-[18px]" /></IconBtn>
                )}
                <IconBtn label="More"><MoreVertical className="h-[18px] w-[18px]" /></IconBtn>
                <div className="ml-auto flex items-center text-xs text-muted-foreground">
                  {list.length ? `1–${list.length} of ${list.length}` : "0 of 0"}
                  <IconBtn label="Newer"><ChevronLeft className="h-[18px] w-[18px]" /></IconBtn>
                  <IconBtn label="Older"><ChevronRight className="h-[18px] w-[18px]" /></IconBtn>
                </div>
              </div>

              {folder === "inbox" && !query && (
                <div className="flex shrink-0 border-b border-border">
                  {([["primary", "Primary", Inbox], ["promotions", "Promotions", Tag], ["social", "Social", Users]] as const).map(([id, label, Icon]) => {
                    const n = emails.filter((e) => e.folder === "inbox" && e.category === id && e.unread).length;
                    return (
                      <button key={id} onClick={() => setTab(id)}
                        className={cn("relative flex h-14 w-64 max-w-[33%] items-center gap-4 px-4 text-sm font-medium transition-colors hover:bg-row-hover",
                          tab === id ? "text-primary" : "text-muted-foreground")}>
                        <Icon className="h-5 w-5" />{label}
                        {n > 0 && <span className="rounded-full bg-primary px-2 text-[11px] text-primary-foreground">{n} new</span>}
                        {tab === id && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {folder === "spam" && (
                <div className="flex shrink-0 items-center gap-3 bg-muted px-6 py-3 text-sm text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Messages flagged by your spam detection model. Review them and mark any as “Not spam”.
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {list.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-muted-foreground">
                    <div><Inbox className="mx-auto mb-3 h-12 w-12 opacity-40" /><p>Nothing here. Enjoy your day!</p></div>
                  </div>
                ) : list.map((e) => (
                  <div key={e.id}
                    onClick={() => { setOpenId(e.id); update(e.id, { unread: false }); }}
                    className={cn("group relative flex h-11 cursor-pointer items-center border-b border-border pl-2 pr-4 text-sm transition-shadow hover:z-10 hover:shadow-row",
                      e.unread ? "bg-surface" : "bg-row-read",
                      selected.has(e.id) && "bg-secondary")}>
                    <label onClick={(ev) => ev.stopPropagation()} className="grid h-10 w-10 shrink-0 place-items-center">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={selected.has(e.id)}
                        onChange={() => setSelected((s) => { const n = new Set(s); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; })} />
                    </label>
                    <button onClick={(ev) => { ev.stopPropagation(); update(e.id, { starred: !e.starred }); }} className="grid h-8 w-8 shrink-0 place-items-center">
                      <Star className={cn("h-[18px] w-[18px]", e.starred ? "fill-star text-star" : "text-muted-foreground")} />
                    </button>
                    <div className={cn("w-48 shrink-0 truncate pl-2", e.unread && "font-bold")}>{e.from}</div>
                    <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                      <VerdictChip v={e.verdict} small />
                      <span className={cn("max-w-[60%] shrink-0 truncate", e.unread && "font-bold")}>{e.subject}</span>
                      <span className="truncate text-muted-foreground">— {e.body.replace(/\n/g, " ")}</span>
                    </div>
                    <div className={cn("ml-4 w-16 shrink-0 text-right text-xs group-hover:hidden", e.unread ? "font-bold" : "text-muted-foreground")}>{e.time}</div>
                    <div className="ml-4 hidden shrink-0 items-center group-hover:flex" onClick={(ev) => ev.stopPropagation()}>
                      <IconBtn label="Archive" className="h-8 w-8"><Archive className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Delete" className="h-8 w-8" onClick={() => { setEmails((es) => es.filter((x) => x.id !== e.id)); notify("Moved to Bin"); }}><Trash2 className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Mark unread" className="h-8 w-8" onClick={() => update(e.id, { unread: !e.unread })}><Mail className="h-4 w-4" /></IconBtn>
                      <IconBtn label="Snooze" className="h-8 w-8"><Clock className="h-4 w-4" /></IconBtn>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Right rail */}
        <aside className="hidden w-14 shrink-0 flex-col items-center gap-2 pt-2 lg:flex">
          {[Calendar, StickyNote, CheckSquare, Users].map((I, i) => (
            <IconBtn key={i} label="Side app"><I className="h-5 w-5" /></IconBtn>
          ))}
          <div className="my-2 h-px w-5 bg-border" />
          <IconBtn label="Spam checker" onClick={() => setCheckerOpen(true)}><Sparkles className="h-5 w-5 text-primary" /></IconBtn>
        </aside>
      </div>

      {composeOpen && (
        <Compose onClose={() => setComposeOpen(false)} onSend={(mail) => {
          setEmails((es) => [mail, ...es]); setComposeOpen(false);
          notify(mail.verdict?.label === "spam" ? "Sent — but your model flagged it as spam" : "Message sent");
        }} />
      )}
      {checkerOpen && <Checker onClose={() => setCheckerOpen(false)} />}

      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up rounded-md bg-foreground px-6 py-3 text-sm text-background shadow-float">{toast}</div>
      )}
    </div>
  );
}

function EmailView({ email, onBack, update, notify }: { email: Email; onBack: () => void; update: (id: string, p: Partial<Email>) => void; notify: (m: string) => void }) {
  const spam = email.verdict?.label === "spam";
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-1 px-2">
        <IconBtn label="Back" onClick={onBack}><ArrowLeft className="h-[18px] w-[18px]" /></IconBtn>
        <IconBtn label="Archive"><Archive className="h-[18px] w-[18px]" /></IconBtn>
        <IconBtn label={email.folder === "spam" ? "Not spam" : "Report spam"} onClick={() => {
          update(email.id, { folder: email.folder === "spam" ? "inbox" : "spam" });
          notify(email.folder === "spam" ? "Moved to Inbox" : "Reported as spam"); onBack();
        }}><ShieldAlert className="h-[18px] w-[18px]" /></IconBtn>
        <IconBtn label="Delete"><Trash2 className="h-[18px] w-[18px]" /></IconBtn>
        <IconBtn label="Mark unread" onClick={() => { update(email.id, { unread: true }); onBack(); }}><Mail className="h-[18px] w-[18px]" /></IconBtn>
        <IconBtn label="More"><MoreVertical className="h-[18px] w-[18px]" /></IconBtn>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-10 sm:pl-16">
        <div className="flex flex-wrap items-center gap-3 py-4">
          <h1 className="font-display text-[22px]">{email.subject}</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{email.folder === "spam" ? "Spam" : "Inbox"}</span>
        </div>

        {email.verdict && (
          <div className={cn("mb-6 rounded-xl p-4", spam ? "bg-danger-soft" : "bg-safe-soft")}>
            <div className="flex items-start gap-3">
              {spam ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-safe" />}
              <div className="flex-1">
                <p className={cn("font-medium", spam ? "text-destructive" : "text-safe")}>
                  {spam ? "Why is this message in spam?" : "This message looks safe"}
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  Your model classified this as <b>{spam ? "spam" : "not spam"}</b> with {Math.round(email.verdict.confidence * 100)}% confidence.
                </p>
                <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface">
                  <div className={cn("h-full rounded-full", spam ? "bg-destructive" : "bg-safe")} style={{ width: `${email.verdict.confidence * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {email.verdict.reasons.map((r) => <span key={r} className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs">{r}</span>)}
                </div>
              </div>
              <button onClick={() => { update(email.id, { folder: spam ? "inbox" : "spam" }); notify(spam ? "Moved to Inbox" : "Reported as spam"); onBack(); }}
                className="shrink-0 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-primary hover:bg-secondary">
                {spam ? "Report not spam" : "Report spam"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full font-medium text-primary-foreground", colorFor(email.from))}>{email.from[0]}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-bold">{email.from}</span>
              <span className="truncate text-xs text-muted-foreground">&lt;{email.email}&gt;</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{email.time}</span>
            </div>
            <div className="text-xs text-muted-foreground">to me</div>
            <div className={cn("mt-6 whitespace-pre-wrap text-sm leading-6", spam && "select-none blur-[0.3px]")}>{email.body}</div>
            <div className="mt-10 flex gap-3">
              <button className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-row-hover"><Reply className="h-4 w-4" />Reply</button>
              <button className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-row-hover"><Forward className="h-4 w-4" />Forward</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Scanning() {
  return (
    <div className="relative h-1 overflow-hidden rounded bg-secondary">
      <div className="absolute inset-y-0 w-1/3 animate-scan bg-primary" />
    </div>
  );
}

function Compose({ onClose, onSend }: { onClose: () => void; onSend: (e: Email) => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [min, setMin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState<Verdict | null>(null);

  const check = async () => { setBusy(true); setV(await classifyMessage(`${subject}\n${body}`)); setBusy(false); };
  const send = async () => {
    setBusy(true);
    const verdict = await classifyMessage(`${subject}\n${body}`);
    setBusy(false);
    onSend({ id: crypto.randomUUID(), from: "Me", email: to || "unknown", subject: subject || "(no subject)", body, time: "Now", unread: false, starred: false, folder: "sent", verdict });
  };

  return (
    <div className={cn("fixed bottom-0 right-16 z-40 flex w-[540px] max-w-[calc(100vw-2rem)] animate-slide-up flex-col overflow-hidden rounded-t-xl bg-surface shadow-float", min ? "h-10" : "h-[560px]")}>
      <div onClick={() => setMin((m) => !m)} className="flex h-10 shrink-0 cursor-pointer items-center bg-muted pl-4 pr-1 text-sm font-medium">
        New Message
        <div className="ml-auto flex" onClick={(e) => e.stopPropagation()}>
          <IconBtn label="Minimise" className="h-8 w-8" onClick={() => setMin((m) => !m)}><Minus className="h-4 w-4" /></IconBtn>
          <IconBtn label="Full screen" className="h-8 w-8"><Maximize2 className="h-4 w-4" /></IconBtn>
          <IconBtn label="Close" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></IconBtn>
        </div>
      </div>
      {!min && (
        <>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipients" className="mx-4 border-b border-border py-2 text-sm outline-none" />
          <input value={subject} onChange={(e) => { setSubject(e.target.value); setV(null); }} placeholder="Subject" className="mx-4 border-b border-border py-2 text-sm outline-none" />
          <textarea value={body} onChange={(e) => { setBody(e.target.value); setV(null); }} className="flex-1 resize-none px-4 py-3 text-sm outline-none" />
          <div className="px-4 pb-2">
            {busy && <Scanning />}
            {v && !busy && (
              <div className={cn("flex flex-wrap items-center gap-2 rounded-lg p-2 text-xs", v.label === "spam" ? "bg-danger-soft" : "bg-safe-soft")}>
                <VerdictChip v={v} />
                {v.reasons.slice(0, 3).map((r) => <span key={r} className="text-muted-foreground">• {r}</span>)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 px-4 pb-3">
            <button onClick={send} disabled={busy} className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-shadow hover:shadow-row disabled:opacity-60">Send</button>
            <button onClick={check} disabled={busy || !body} className="ml-2 flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-secondary disabled:opacity-50">
              <Sparkles className="h-4 w-4" />Check spam
            </button>
            {[Paperclip, Link2, Smile, ImageIcon, Lock].map((I, i) => <IconBtn key={i} label="Tool" className="h-8 w-8"><I className="h-4 w-4" /></IconBtn>)}
            <IconBtn label="Discard" className="ml-auto h-8 w-8" onClick={onClose}><Trash2 className="h-4 w-4" /></IconBtn>
          </div>
        </>
      )}
    </div>
  );
}

function Checker({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState<Verdict | null>(null);
  const run = async () => { setBusy(true); setV(null); setV(await classifyMessage(text)); setBusy(false); };
  const samples = ["URGENT! You have WON a free iPhone. Click here to claim now!!!", "Hey, are we still meeting for lunch tomorrow at 1?"];
  const spam = v?.label === "spam";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl animate-slide-up rounded-3xl bg-surface p-6 shadow-float">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><Sparkles className="h-5 w-5 text-primary" /></div>
          <div className="flex-1">
            <h2 className="font-display text-xl">Spam checker</h2>
            <p className="text-sm text-muted-foreground">Paste any message or email to classify it.</p>
          </div>
          <IconBtn label="Close" onClick={onClose}><X className="h-5 w-5" /></IconBtn>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste message text here…"
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
        <div className="mt-2 flex flex-wrap gap-2">
          {samples.map((s) => <button key={s} onClick={() => setText(s)} className="truncate rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-row-hover sm:max-w-[48%]">{s}</button>)}
        </div>
        <div className="mt-4">{busy && <Scanning />}</div>
        {v && (
          <div className={cn("mt-2 animate-slide-up rounded-2xl p-5", spam ? "bg-danger-soft" : "bg-safe-soft")}>
            <div className="flex items-center gap-3">
              {spam ? <ShieldAlert className="h-8 w-8 text-destructive" /> : <ShieldCheck className="h-8 w-8 text-safe" />}
              <div>
                <div className={cn("font-display text-2xl", spam ? "text-destructive" : "text-safe")}>{spam ? "Spam" : "Not spam"}</div>
                <div className="text-sm text-muted-foreground">{Math.round(v.confidence * 100)}% confidence</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{v.reasons.map((r) => <span key={r} className="rounded-full bg-surface px-2.5 py-0.5 text-xs">{r}</span>)}</div>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <button onClick={run} disabled={!text.trim() || busy} className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:shadow-row disabled:opacity-50">
            {busy ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}
