export async function refreshAccessToken() {
    
    const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error("Failed to refresh token");
    }

    return res.json(); 
}