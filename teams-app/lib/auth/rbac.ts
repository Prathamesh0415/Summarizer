// import { NextRequest, NextResponse } from "next/server";
// import { getAuthContext } from "./context";

// export function requireRole(allowedRoles: Array<"USER" | "ADMIN">){
//     return function (req: NextRequest) {
//         const { role } = getAuthContext(req)

//         if(!allowedRoles.includes(role as any)){
//             return NextResponse.json(
//                 {error: "Forbidden"},
//                 {status: 403}
//             )
//         }

//         return null
//     }
// }