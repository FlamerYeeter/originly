export const dynamic = "force-dynamic";

export async function GET() {
  const validationKey = process.env.DOMAIN_VALIDATION_KEY?.trim();

  if (!validationKey) {
    return new Response("Domain validation key is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(validationKey, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
