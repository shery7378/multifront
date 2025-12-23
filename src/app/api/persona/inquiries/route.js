import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type = "kyb", referenceId, fields } = body || {};
    const templateId = type === "kyb" ? process.env.PERSONA_KYB_TEMPLATE_ID : process.env.PERSONA_KYC_TEMPLATE_ID;
    const r = await fetch("https://withpersona.com/api/v1/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "inquiry",
          attributes: {
            templateId,
            referenceId: referenceId || null,
            fields: fields || undefined,
          },
        },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: "persona_create_failed", detail: t }, { status: 500 });
    }
    const json = await r.json();
    const inquiryId = json?.data?.id;
    return NextResponse.json({
      inquiryId,
      templateId,
      environmentId: process.env.PERSONA_ENV_ID || process.env.NEXT_PUBLIC_PERSONA_ENV_ID || "sandbox",
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "unknown_error" }, { status: 500 });
  }
}
