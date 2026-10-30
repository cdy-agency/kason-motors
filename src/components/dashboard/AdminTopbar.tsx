"use client";
import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import Link from "next/link";
import { Bell, Search, Plus, Mail, CarFront, Wrench, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type AdminTopbarProps = {
  fullName: string;
  roleLabel: string;
};

type NotificationItem = {
  kind: "contact" | "test_drive" | "maintenance";
  id: string | number;
  name?: string;
  full_name?: string;
  car_name?: string | null;
  vehicle_model?: string | null;
  message?: string;
  notes?: string | null;
  request_summary?: string;
  created_at: string;
  read: boolean;
};

const getInitials = (fullName: string) =>
  fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getNotificationTitle = (item: NotificationItem) => {
  if (item.kind === "test_drive") {
    return `${item.full_name || "New customer"} requested a test drive`;
  }
  if (item.kind === "maintenance") {
    return `${item.name || "New customer"} requested maintenance`;
  }
  return `Message from ${item.name || "a customer"}`;
};

const getNotificationDescription = (item: NotificationItem) => {
  if (item.kind === "test_drive") {
    return [item.car_name, item.notes].filter(Boolean).join(" · ") || "Test drive request";
  }
  if (item.kind === "maintenance") {
    return item.request_summary || item.vehicle_model || "Maintenance request";
  }
  return item.message || "New contact message";
};

const getNotificationKindLabel = (kind: NotificationItem["kind"]) =>
  kind === "test_drive" ? "Test drive" : kind === "maintenance" ? "Maintenance" : "Contact";

const getNotificationIcon = (kind: NotificationItem["kind"]) =>
  kind === "test_drive" ? CarFront : kind === "maintenance" ? Wrench : Mail;

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-RW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function AdminTopbar({ fullName, roleLabel }: AdminTopbarProps) {
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const notificationsOpenRef = useRef(false);
  const [, startTransition] = useTransition();
  notificationsOpenRef.current = notificationsOpen;

  const fetchUnread = useCallback(async () => {
    const res = await fetch("/api/admin/notifications/unread");
    if (!res.ok) {
      throw new Error("Could not refresh notification count.");
    }
    const data = (await res.json()) as { total?: number };
    startTransition(() => {
      setUnreadTotal(typeof data.total === "number" ? data.total : 0);
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/notification?limit=10");
      const data = (await response.json()) as {
        items?: NotificationItem[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || "Could not load notifications.");
      }
      setNotifications(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setNotificationsError(
        error instanceof Error ? error.message : "Could not load notifications.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const toggleNotifications = () => {
    const shouldOpen = !notificationsOpen;
    setNotificationsOpen(shouldOpen);
    if (shouldOpen) void fetchNotifications();
  };

  useEffect(() => {
    void fetchUnread().catch((error: unknown) => {
      console.error("Failed to load unread notification count", error);
    });

    const channel = supabase
      .channel("topbar-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contacts" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "contacts" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "book_test_driver" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "book_test_driver" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "maintenance_requests" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "maintenance_requests" },
        () => {
          void fetchUnread().catch((error: unknown) =>
            console.error("Failed to refresh unread notification count", error),
          );
          if (notificationsOpenRef.current) void fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, fetchUnread]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !notificationPanelRef.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search anything here..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-primary w-64 transition-all"
          />
        </div>

        <button
          type="button"
          className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
        >
          <Plus size={16} />
        </button>

        <div ref={notificationPanelRef} className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
            title="View notifications"
            aria-label="View notifications"
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
          >
            <Bell size={16} />
            {unreadTotal > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              role="dialog"
              aria-label="Latest notifications"
              className="absolute right-0 top-full z-50 mt-3 flex max-h-[min(34rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
            >
              <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Latest 10 updates</p>
                </div>
                {unreadTotal > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {unreadTotal > 99 ? "99+" : unreadTotal} unread
                  </span>
                )}
              </header>

              <div className="overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading notifications…
                  </p>
                ) : notificationsError ? (
                  <p role="alert" className="px-4 py-8 text-center text-sm text-red-600">
                    {notificationsError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    You’re all caught up. No notifications yet.
                  </p>
                ) : (
                  <ul>
                    {notifications.map((item) => {
                      const Icon = getNotificationIcon(item.kind);
                      return (
                        <li key={`${item.kind}-${item.id}`}>
                          <Link
                            href="/admin/notification"
                            onClick={() => setNotificationsOpen(false)}
                            className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50 ${
                              item.read ? "" : "bg-primary/[0.03]"
                            }`}
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon size={16} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-gray-900">
                                  {getNotificationTitle(item)}
                                </span>
                                {!item.read && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}
                              </span>
                              <span className="mt-1 block truncate text-xs text-gray-600">
                                {getNotificationDescription(item)}
                              </span>
                              <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                                {getNotificationKindLabel(item.kind)}
                                <span aria-hidden="true">·</span>
                                <Clock size={11} />
                                {formatNotificationTime(item.created_at)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Link
                href="/admin/notification"
                onClick={() => setNotificationsOpen(false)}
                className="border-t border-gray-100 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-gray-50"
              >
                View more
              </Link>
            </section>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-100">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
            {getInitials(fullName)}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-gray-900 leading-tight">
              {fullName}
            </p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}