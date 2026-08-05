import { Suspense } from "react";
import ProsecutionRegisterComponent from "../ProsecutionRegisterComponent";
const Page = async () => (
  <Suspense>
    <ProsecutionRegisterComponent />
  </Suspense>
);
export default Page;
