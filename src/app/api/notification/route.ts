import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import nodemailer from "nodemailer";

import { getCurrentUserFromRequest } from "@/lib/auth/session";
import { ContactEmail } from "@/lib/email.templete";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type ContactNotificationRow = {
  kind: "contact";
  id: string | number;
  name: string;
  email: string;
  phonenumber: string | null;
  message: string;
  created_at: string;
  read: boolean;
};

export type TestDriveNotificationRow = {
  kind: "test_drive";
  id: number;
  car_id: number;
  car_name: string | null;
  full_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  notes: string | null;
  created_at: string;
  read: boolean;
};

export type MaintenanceNotificationRow = {
  kind: "maintenance";
  id: number;
  name: string;
  phone: string;
  email: string | null;
  vehicle_model: string | null;
  license_plate: string | null;
  request_summary: string;
  needs_insurance: boolean;
  insurance: string | null;
  insurance_policy_number: string | null;
  created_at: string;
  read: boolean;
};

export type AdminNotificationItem =
  | ContactNotificationRow
  | TestDriveNotificationRow
  | MaintenanceNotificationRow;

// ── GET — fetch all notifications for admin dashboard ──────────────────────
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? null : Number(rawLimit);
  if (
    rawLimit !== null &&
    (!Number.isSafeInteger(limit) || (limit as number) < 1 || (limit as number) > 50)
  ) {
    return NextResponse.json({ message: "Invalid notification limit." }, { status: 400 });
  }

  let contactsQuery = supabase
    .from("contacts")
    .select("id, name, email, phonenumber, message, created_at, read")
    .order("created_at", { ascending: false });
  let bookingsQuery = supabase
    .from("book_test_driver")
    .select(
      "id, car_id, full_name, email, phone, preferred_date, notes, created_at, read, cars ( name )",
    )
    .order("created_at", { ascending: false });
  let maintenanceQuery = supabase
    .from("maintenance_requests")
    .select(
      "id, name, phone, email, vehicle_model, license_plate, request_summary, needs_insurance, insurance, insurance_policy_number, created_at, read",
    )
    .order("created_at", { ascending: false });

  if (limit !== null) {
    contactsQuery = contactsQuery.limit(limit);
    bookingsQuery = bookingsQuery.limit(limit);
    maintenanceQuery = maintenanceQuery.limit(limit);
  }

  const [contactsRes, bookingsRes, maintenanceRes] = await Promise.all([
    contactsQuery,
    bookingsQuery,
    maintenanceQuery,
  ]);

  if (contactsRes.error) {
    return NextResponse.json({ message: contactsRes.error.message }, { status: 500 });
  }
  if (bookingsRes.error) {
    return NextResponse.json({ message: bookingsRes.error.message }, { status: 500 });
  }
  if (maintenanceRes.error) {
    return NextResponse.json({ message: maintenanceRes.error.message }, { status: 500 });
  }

  const contacts: ContactNotificationRow[] = (contactsRes.data ?? []).map((row) => ({
    kind: "contact" as const,
    id: row.id as string | number,
    name: row.name as string,
    email: row.email as string,
    phonenumber: (row.phonenumber as string | null) ?? null,
    message: row.message as string,
    created_at: row.created_at as string,
    read: Boolean(row.read),
  }));

  type BookingRow = {
    id: number;
    car_id: number;
    full_name: string;
    email: string;
    phone: string;
    preferred_date: string;
    notes: string | null;
    created_at: string;
    read: boolean;
    cars: { name: string | null } | { name: string | null }[] | null;
  };

  const bookings: TestDriveNotificationRow[] = (bookingsRes.data ?? []).map((raw) => {
    const row = raw as unknown as BookingRow;
    const car = Array.isArray(row.cars) ? row.cars[0] : row.cars;
    return {
      kind: "test_drive" as const,
      id: row.id,
      car_id: row.car_id,
      car_name: car?.name ?? null,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      preferred_date: row.preferred_date,
      notes: row.notes,
      created_at: row.created_at,
      read: Boolean(row.read),
    };
  });

  const maintenance: MaintenanceNotificationRow[] = (maintenanceRes.data ?? []).map((row) => ({
    kind: "maintenance" as const,
    id: row.id as number,
    name: row.name as string,
    phone: row.phone as string,
    email: (row.email as string | null) ?? null,
    vehicle_model: (row.vehicle_model as string | null) ?? null,
    license_plate: (row.license_plate as string | null) ?? null,
    request_summary: row.request_summary as string,
    needs_insurance: Boolean(row.needs_insurance),
    insurance: (row.insurance as string | null) ?? null,
    insurance_policy_number: (row.insurance_policy_number as string | null) ?? null,
    created_at: row.created_at as string,
    read: Boolean(row.read),
  }));

  const items: AdminNotificationItem[] = [...contacts, ...bookings, ...maintenance].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return NextResponse.json({ items: limit === null ? items : items.slice(0, limit) });
}

// ── POST — save contact form message from public contact page ──────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phonenumber, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: "Name, email and message are required." },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("contacts").insert([
      { name, email, phonenumber: phonenumber || null, message },
    ]);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 },
      );
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_USER,
      subject: `New message from ${name}`,
      html: ContactEmail({ name, email, phonenumber, message }),
    });

    return NextResponse.json(
      { success: true, message: "Message sent successfully" },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}