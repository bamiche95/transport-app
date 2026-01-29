
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";


export async function GET (req: NextRequest){

  const user = await getUserFromJWT();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  try{

    const [row] = await pool.query(
      `SELECT 
   * FROM waste_types
      
      `, [user.id]
    )

return NextResponse.json(row);

  }catch (error: any){
    console.error("failed to fetch waste types:", error);
    return NextResponse.json({error: error.message}, {status:500})
  }

}