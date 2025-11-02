// app/api/documents/create/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("[documents/create] Received data:", body);

    // Валидация обязательных полей
    if (!body.project_id || !body.name || !body.type || !body.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: project_id, name, type, status",
        },
        { status: 400 }
      );
    }

    const insertData = {
      project_id: body.project_id,
      name: body.name,
      type: body.type,
      status: body.status,
      file_url: body.file_url || null,
      content: body.content || null,
      podpislon_id: body.podpislon_id || null,
      sign_url: body.sign_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("[documents/create] Inserting data:", insertData);

    const { data, error } = await supabase
      .from("documents")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      console.error("[documents/create] Supabase error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 400 }
      );
    }

    console.log("[documents/create] Document created successfully:", data);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("[documents/create] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
