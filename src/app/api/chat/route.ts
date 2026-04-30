import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { answer } from "@/lib/chatbot";

export const dynamic = "force-dynamic";

const chatSchema = z.object({
  message: z.string().trim().min(1, "Ask me something").max(500),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const data = chatSchema.parse(body);
    const response = await answer(data.message, user);
    return NextResponse.json(response);
  } catch (e) {
    return apiError(e);
  }
}
