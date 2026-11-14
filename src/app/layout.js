import "./globals.css";
import Providers from "./Provider";
import NavBar from "@/component/NavBar";

const themeScript = `
  (function () {
    try {
      const savedTheme = localStorage.getItem("connect-pros-theme");
      const theme = savedTheme === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
    } catch (error) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
`;

export const metadata = {
  title: "Connect Pros",
  description: "Learn together. Build together. Grow together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>

      <body className="min-h-screen flex flex-col">
        <Providers>
          <NavBar />
          <main className="flex-1 pt-[76px]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
