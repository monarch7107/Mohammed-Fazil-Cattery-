import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow text-center">Restricted area</p>
        <h1 className="mt-4 text-center font-serif text-display-md text-navy">Admin sign in</h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-navy/65">
          Manage kittens, pet food listings and gallery photographs for Mohammed Fazil Cattery.
        </p>

        <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
          <LoginForm returnTo={returnTo} />
        </div>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-navy/50">
          Credentials are configured through the admin user record or the{" "}
          <code className="rounded bg-navy/8 px-1.5 py-0.5 text-[11.5px]">ADMIN_EMAIL</code> /{" "}
          <code className="rounded bg-navy/8 px-1.5 py-0.5 text-[11.5px]">OWNER_EMAIL</code>{" "}
          environment variables.
        </p>
      </div>
    </div>
  );
}
