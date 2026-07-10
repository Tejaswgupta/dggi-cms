import { Suspense } from "react";
import NotificationsComponent from "../NotificationsComponent";

const Page = () => (
  <Suspense fallback={null}>
    <NotificationsComponent />
  </Suspense>
);

export default Page;
