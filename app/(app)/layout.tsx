import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/kinde";
import OnboardingModal from "@/app/components/OnboardingModal";
import { Toaster } from "react-hot-toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAuth();

  if (!auth.authenticated) {
    redirect("/");
  }

  return (
    <>
      <OnboardingModal />
      <Toaster position="top-center" />
      {children}
    </>
  );
}
