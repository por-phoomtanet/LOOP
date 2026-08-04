import { AuthGuard } from "@/shared/guards/AuthGuard";
import { PaymentPage } from "@/modules/rentals/components/PaymentPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <PaymentPage rentalId={Number(id)} />
    </AuthGuard>
  );
}
