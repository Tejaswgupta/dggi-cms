import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonComp = () => {
  return (
    <div className="w-full pt-[15px] flex flex-col gap-5">
      <div className="GsansFont w-full gap-[20px] px-[25px] h-auto flex flex-col py-[18px]">
        <Skeleton className="w-[380px] h-[48px]" />
        <Skeleton className="w-[580px] h-[48px]" />
      </div>

      <div className=" px-[25px] w-full flex flex-col justify-center items-center gap-[60px]">
        <div className="flex justify-between items-center gap-6  w-[92%] pt-[30px]">
          <Skeleton className="w-[48%] min-h-[60px] rounded-[15px]" />
          <Skeleton className="w-[48%] min-h-[60px] rounded-[15px]" />
        </div>
        <div className=" w-[92%] grid grid-cols-4 gap-4  min-h-[200px] ">
          <Skeleton className="rounded-[13px]" />
          <Skeleton className="rounded-[13px]" />
          <Skeleton className="rounded-[13px]" />
          <Skeleton className="rounded-[13px]" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonComp;
