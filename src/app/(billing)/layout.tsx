import { SessionProvider } from "next-auth/react";

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
