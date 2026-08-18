import "./globals.css";
import Link from "next/link";
export const metadata = { title: "Smart Tank", description: "ESP32-S3 saltwater laboratory dashboard" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><header className="border-b p-4"><div className="mx-auto flex max-w-6xl gap-4"><strong>Smart Tank</strong>{["/","/history","/experiments","/events","/reports","/system"].map((href,i)=><Link key={href} href={href}>{["Live","History","Experiments","Events","Reports","System"][i]}</Link>)}</div></header><main className="mx-auto max-w-6xl p-4">{children}</main></body></html>;
}
