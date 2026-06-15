import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, getUser } = await getKindeServerSession();
  const user = await getUser();

  if (!isAuthenticated || !user) {
    redirect("/");
  }

  let dbUser: { role: string } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });
  } catch (err) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">🔌</div>
          <h1 className="text-2xl font-bold text-amber-400">Connexion perdue</h1>
          <p className="text-zinc-400">
            Impossible de contacter le serveur de base de données. Veuillez réessayer dans quelques instants.
          </p>
          <p className="text-xs text-zinc-600">
            Si le problème persiste, vérifiez que votre base de données est active.
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  if (dbUser?.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}

