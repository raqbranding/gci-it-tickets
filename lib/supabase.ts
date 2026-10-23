
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const esPruebas =
  typeof window !== "undefined" &&
  window.location.hostname ===
    "helpdesk-test.globalcoffeeindustries.com";

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey,
  {
    cookieOptions: {
      name: esPruebas ? "gci-sso-test" : "gci-sso",
      domain: ".globalcoffeeindustries.com",
      path: "/",
      sameSite: "lax",
      secure: true,
    },
  }
);
