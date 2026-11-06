import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white p-6 text-center">
      <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#11998e] to-[#22c55e] bg-clip-text text-transparent">
        404
      </h1>
      <p className="text-xl text-[#9ca3af] mb-8">Page Not Found</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#085d56] to-[#00998c] text-white text-sm font-medium hover:opacity-90 transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
