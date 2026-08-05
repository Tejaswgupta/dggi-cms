"use server";
import { Suspense } from "react";
import IncidentReportComponent from "../IncidentReportComponent";

const Page = async () => {
  return (
    <Suspense>
      <IncidentReportComponent />
    </Suspense>
  );
};

export default Page;
