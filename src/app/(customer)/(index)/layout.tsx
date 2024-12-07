import { Poppins } from "next/font/google";


const poppins = Poppins({
    weight: ['300', '400', '500', '700', '800'],
    subsets: ['latin-ext']
})

import '../../globalsLanding.css'

export default function LandingRootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body className={poppins.className}>{children}</body>
      </html>
    );
  }
  