import { redirect } from "next/navigation";

// Root route → Overview
export default function Home() {
  redirect("/overview");
}
