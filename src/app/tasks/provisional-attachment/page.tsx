"use server";
import { Suspense } from "react";
import ProvisionalAttachmentComponent from "../ProvisionalAttachmentComponent";

const Page = async () => {
  return (
    <Suspense>
      <ProvisionalAttachmentComponent />
    </Suspense>
  );
};

export default Page;
