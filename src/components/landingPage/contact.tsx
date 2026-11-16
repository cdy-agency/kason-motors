"use client";

import { useState } from "react";
import { z } from "zod";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./Navbar";
import Footer from "./Footer";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phonenumber: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;
type FormErrors = Partial<Record<keyof ContactFormData, string>>;

export default function Contact() {
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    email: "",
    phonenumber: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as typeof e.target & {
      name: keyof ContactFormData;
    };
    const { name, value } = target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (submitted) {
      const result = contactSchema.safeParse({ ...form, [name]: value });
      if (!result.success) {
        const msg = result.error.flatten().fieldErrors[name]?.[0];
        setErrors((prev) => ({ ...prev, [name]: msg }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    const result = contactSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const [key, messages] of Object.entries(
        result.error.flatten().fieldErrors
      )) {
        fieldErrors[key as keyof ContactFormData] = (messages as string[])?.[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phonenumber: form.phonenumber,
          message: form.message,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error("Failed to send message");
        return;
      }

      toast.success("Message sent successfully");
      setForm({ name: "", email: "", phonenumber: "", message: "" });
      setErrors({});
      setSubmitted(false);
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const inputClass = (field: keyof ContactFormData) =>
    `w-full rounded-lg border bg-bg px-3 py-2.5 text-sm text-font placeholder:text-gray-mid focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition ${
      errors[field] ? "border-primary" : "border-line/30"
    }`;

  const labelClass = "mb-1 block text-xs font-medium text-font/85";

  const ErrorMsg = ({ field }: { field: keyof ContactFormData }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-accent">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-bg text-font">
      <ToastContainer theme="dark" className="!top-20" />
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section className="relative h-100 md:h-120 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/car2.jpeg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary-dark/85 via-primary/60 to-ink/80" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <span className="inline-block text-accent text-xs font-bold tracking-[0.25em] uppercase mb-4 border border-accent/40 px-4 py-1 rounded-full">
            Kigali Special Economic Zone · Rwanda
          </span>
          <h1 className="text-3xl font-bold tracking-wide text-font md:text-4xl">
            Experience Our Service
          </h1>
          <p className="mt-3 text-sm text-font/80 uppercase tracking-[0.15em]">
            Schedule a visit
          </p>
        </div>
      </section>

      <section className="bg-bg px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-font">Get In Touch</h2>
            <p className="mt-1 text-sm text-font/75">
              Have questions or want to schedule a test drive? Our team is ready
              to assist you.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-6 md:flex-row">
            <div className="min-h-[280px] flex-1 overflow-hidden border border-line/25 bg-gray-dark shadow-sm sm:min-h-[360px]">
              <iframe
                title="Our Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.4956836786455!2d30.05887!3d-1.94995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwNTYnNTkuOCJTIDMwwrAwMyczMS45IkU!5e0!3m2!1sen!2srw!4v1681234567890!5m2!1sen!2srw"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "360px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex-1 border border-line/25 bg-gray-dark p-5 shadow-sm sm:p-6">
              <h3 className="mb-5 text-base font-semibold text-font">
                Send us a message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={inputClass("name")}
                  />
                  <ErrorMsg field="name" />
                </div>

                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={inputClass("email")}
                  />
                  <ErrorMsg field="email" />
                </div>

                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    name="phonenumber"
                    type="tel"
                    value={form.phonenumber}
                    onChange={handleChange}
                    placeholder="+250 7XX XXX XXX"
                    className={inputClass("phonenumber")}
                  />
                  <ErrorMsg field="phonenumber" />
                </div>

                <div>
                  <label className={labelClass}>Your Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Write your message here..."
                    className={inputClass("message")}
                  />
                  <ErrorMsg field="message" />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full cursor-pointer bg-primary py-3.5 text-sm font-bold text-font transition-colors hover:bg-primary-dark disabled:opacity-70"
                >
                  {isSending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}