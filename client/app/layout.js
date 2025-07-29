import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import PersonalRoomProvider from "./lib/PersonalRoomProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CollabNest",
  description: "Where ideas hatch into startups",
  icons: {
    icon: '/assets/icons/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PersonalRoomProvider>
          {children}
        </PersonalRoomProvider>
      </body>
    </html>
  );
}
