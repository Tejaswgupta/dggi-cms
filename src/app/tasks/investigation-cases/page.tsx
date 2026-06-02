import { Suspense } from "react";
import DGGIComponent from "../DGGIComponent";

const Page = async () => {
  return (
    <Suspense fallback={null}>
      <DGGIComponent />
    </Suspense>
  );
};

export default Page;
