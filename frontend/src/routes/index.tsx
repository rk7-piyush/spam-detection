import { createFileRoute } from "@tanstack/react-router";
import MailApp from "@/components/mail/MailApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpamGuard Mail — Spam Detection Inbox" },
      { name: "description", content: "A Gmail-style inbox that classifies every message as spam or not spam." },
      { property: "og:title", content: "SpamGuard Mail — Spam Detection Inbox" },
      { property: "og:description", content: "A Gmail-style inbox that classifies every message as spam or not spam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MailApp,
});
