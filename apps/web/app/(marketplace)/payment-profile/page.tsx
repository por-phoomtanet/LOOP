import { AuthGuard } from "@/shared/guards/AuthGuard";
import { PaymentProfileForm } from "@/modules/auth/components/PaymentProfileForm";

export default function Page() {
  return (
    <AuthGuard>
      <PaymentProfileForm />
    </AuthGuard>
  );
}
