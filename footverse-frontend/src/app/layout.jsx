import "./globals.css";
import Providers from "@/context/Providers";
import MiniCart from "@/components/cart/MiniCart";

export const metadata = {
  title: "FootVerse — Your Universe of Footwear",
  description:
    "From sports and casual to formal, boots, sandals, and everyday essentials—discover the perfect pair for every style and every step.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <Providers>
          {children}
          <MiniCart />
        </Providers>
      </body>
    </html>
  );
}