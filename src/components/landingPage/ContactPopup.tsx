"use client";

import { useEffect, useState } from "react";

const POPUP_STORAGE_KEY = "kason_admin_popup_closed";
const POPUP_DELAY_MS = 30 * 60 * 1000; // 30 minutes

type FormState = {
  name: string;
  email: string;
  phonenumber: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phonenumber: "",
  message: "Hi, I would like to know more about your available vehicles and arrange a visit.",
};

export default function ContactPopup() {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const wasClosed = window.localStorage.getItem(POPUP_STORAGE_KEY) === "true";
    if (wasClosed) {
      setClosed(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const closePopup = () => {
    window.localStorage.setItem(POPUP_STORAGE_KEY, "true");
    setVisible(false);
    setClosed(true);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phonenumber: form.phonenumber,
          message: form.message,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setStatusMessage(data.message || "Could not send your message.");
        return;
      }

      setStatusMessage("Message sent successfully. Our admin will get back to you soon.");
      window.localStorage.setItem(POPUP_STORAGE_KEY, "true");
      setTimeout(() => {
        setVisible(false);
      }, 1200);
    } catch (error) {
      setStatusMessage("Unable to send your message right now. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };

  if (!visible || closed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-primary/20 bg-gray-dark shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <button
          onClick={closePopup}
          type="button"
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 p-2 text-font transition hover:bg-black/50"
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="px-6 py-8 sm:px-10">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Stay connected
          </div>
          <h2 className="text-2xl font-bold text-font sm:text-3xl">
            Need help finding the right car?
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-font/80">
            Leave a quick message and our admin will contact you shortly. Close this popup and it will not appear again.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-font/80">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="mt-2 w-full rounded-2xl border border-line/40 bg-bg px-4 py-3 text-sm text-font outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block text-sm font-medium text-font/80">
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="mt-2 w-full rounded-2xl border border-line/40 bg-bg px-4 py-3 text-sm text-font outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-font/80">
              Phone
              <input
                name="phonenumber"
                value={form.phonenumber}
                onChange={handleChange}
                placeholder="+250 7XX XXX XXX"
                className="mt-2 w-full rounded-2xl border border-line/40 bg-bg px-4 py-3 text-sm text-font outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block text-sm font-medium text-font/80">
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={4}
                required
                className="mt-2 w-full rounded-2xl border border-line/40 bg-bg px-4 py-3 text-sm text-font outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {statusMessage ? (
              <p className="text-sm text-font/90">{statusMessage}</p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex min-w-[160px] items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-font transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSending ? "Sending..." : "Send Message"}
              </button>
              <button
                type="button"
                onClick={closePopup}
                className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-primary/40 bg-black/20 px-6 py-3 text-sm font-semibold text-font transition hover:border-primary hover:bg-black/30"
              >
                No thanks
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
