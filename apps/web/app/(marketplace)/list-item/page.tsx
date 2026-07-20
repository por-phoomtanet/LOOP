import Link from "next/link";
import { ListItemForm } from "@/modules/products/components/ListItemForm";
import { AuthGuard } from "@/shared/guards/AuthGuard";

export default function Page() {
  return (
    <>
      <div className="border-b border-black/10 px-8 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-black"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          กลับหน้าแรก
        </Link>
      </div>
      <AuthGuard>
        <ListItemForm />
      </AuthGuard>
    </>
  );
}
