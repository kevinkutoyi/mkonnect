// Services are now managed in the onboarding wizard (step 4)
import { redirect } from "next/navigation";
export default function ServicesPage() {
  redirect("/dashboard/onboarding");
}
