import { requireAdminUser } from "@/lib/auth/session";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import AdminTopbar from "@/components/dashboard/AdminTopbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAdminUser();

  return (
    <div className="flex h-dvh min-h-[480px] w-full overflow-hidden bg-gray-50">
      <AdminSidebar fullName={currentUser.fullName} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gray-50">
        <AdminTopbar
          fullName={currentUser.fullName}
          roleLabel={currentUser.role === "admin" ? "Administrator" : "User"}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
