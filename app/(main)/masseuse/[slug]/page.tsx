// Redirect old /masseuse/[slug] URLs to /model/[slug]
import { redirect } from "next/navigation";

interface Props { params: { slug: string } }

export default function OldMasseuseRedirect({ params }: Props) {
  redirect(`/model/${params.slug}`);
}
