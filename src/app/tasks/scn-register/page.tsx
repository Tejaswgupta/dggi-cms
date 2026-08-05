"use server";
import { Suspense } from "react";
import SCNRegisterComponent from "../SCNRegisterComponent";

const Page = async () => {
  return (
    <Suspense>
      <SCNRegisterComponent />
    </Suspense>
  );
};

export default Page;
