import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
const SkeletonComponentForTaskView = () => {
  return (
    <div className="w-full flex items-center flex-col gap-2 py-[3px]">
      <div className="w-full h-[40px] flex">
        <div className="w-[30%] py-[1px]  px-[8px] flex justify-center items-center">
          <Skeleton className="h-4 w-[200px]" />
        </div>

        <div className="w-[25%] py-[1px] px-[7px] flex justify-center items-center">
          <Skeleton className="h-4 w-[90px]" />
        </div>

        <div className="w-[20%] py-[1px] px-[10px]  flex justify-center items-center">
          <Skeleton className="h-4 w-[80px]" />
        </div>

        <div className="w-[20%] py-[1px] px-[10px] flex justify-center items-center">
          <Skeleton className="h-4 w-[70px]" />
        </div>
      </div>
      <div className="w-full px-[25px] flex justify-center flex-col items-center gap-2">
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
        <Skeleton className="h-[40px] w-full" />
      </div>
    </div>
  );
};

export default SkeletonComponentForTaskView;
