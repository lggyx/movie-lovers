import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Movie Lovers",
  description: "Search movies, build your watchlist, rate what you watched and get similar picks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 pb-16">{children}</main>
      </body>
    </html>
  );
}
