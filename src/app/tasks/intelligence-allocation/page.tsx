import { Suspense } from "react";
import IntelligenceAllocationComponent from "../IntelligenceAllocationComponent";
const Page = async () => (
  <Suspense fallback={
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4A5FD4] border-t-transparent" />
    </div>
  }>
    <IntelligenceAllocationComponent />
  </Suspense>
);
export default Page;
