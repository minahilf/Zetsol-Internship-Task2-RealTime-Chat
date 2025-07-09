import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], 
  variable: "--font-poppins",    
});

export const metadata = {
  title: "Chattrix",
  description: "Start chatting now with Chattrix!",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body
        className={`antialiased`}
      >
        {children}
          <Toaster
           position="top-center" toastOptions={{ style: {  
      color: "white",                  
    }}} />
      </body>
    </html>
  );
}
