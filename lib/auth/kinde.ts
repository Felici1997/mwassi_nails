import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function requireAuth() {
    const { isAuthenticated, getUser } = await getKindeServerSession();
    const user = await getUser();

    if (!isAuthenticated || !user || !user.email) {
        return { 
            authenticated: false, 
            user: null,
            error: "Unauthorized" 
        };
    }

    return { 
        authenticated: true, 
        user 
    };
}

export async function getAuthSession() {
    return await getKindeServerSession();
}
