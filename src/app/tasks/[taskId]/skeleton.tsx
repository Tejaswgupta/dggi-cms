import React from "react";
import SkeletonElement from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
const skeleton = () => {
  return (
    <div className="flex w-full h-full justify-center">
      <div className="w-full h-full flex flex-col justify-start items-start">
        <div className="w-full px-[25px] py-[20px] flex justify-between items-center">
          <div className="flex items-center gap-[0.8rem]">
            <SkeletonElement width={30} height={30} className="!rounded-full" />
            <SkeletonElement
              width={70}
              height={20}
              className="!rounded-[8px]"
            />
          </div>
        </div>

        <div className="w-[min(1300px,100%)] px-[25px] py-[10px] flex">
          <div className="w-[45%] h-auto flex flex-col gap-[0px]">
            <div className="px-[20px] w-full h-auto min-h-[60px] flex items-center my-[4px] ">
              <SkeletonElement
                width={350}
                height={60}
                className="!rounded-[12px]"
              />
            </div>
            <div className="flex flex-col gap-[12px] py-[10px] w-full">
              <div className="w-full h-[40px] flex gap-3">
                <SkeletonElement
                  width={120}
                  height={40}
                  className="!rounded-[6px] w-full h-[40px]"
                />
                <div className="w-[72%] h-full flex rounded-[5px] text-[#37352f]">
                  <SkeletonElement
                    width={280}
                    height={40}
                    className="!rounded-[6x] w-full h-[40px]"
                  />
                </div>
              </div>
              <div className="w-full h-[40px] flex gap-3">
                <SkeletonElement
                  width={120}
                  height={40}
                  className="!rounded-[6x] w-full h-[40px]"
                />
                <div className="w-[72%] h-full flex rounded-[5px] text-[#37352f]">
                  <SkeletonElement
                    width={280}
                    height={40}
                    className="!rounded-[6px] w-full h-[40px]"
                  />
                </div>
              </div>
              <div className="w-full h-[40px] flex gap-3">
                <SkeletonElement
                  width={120}
                  height={40}
                  className="!rounded-[6px] w-full h-[40px]"
                />
                <div className="w-[72%] h-full flex rounded-[5px] text-[#37352f]">
                  <SkeletonElement
                    width={280}
                    height={40}
                    className="!rounded-[6px] w-full h-[40px]"
                  />
                </div>
              </div>
              <div className="w-full h-[40px] flex gap-3">
                <SkeletonElement
                  width={120}
                  height={40}
                  className="!rounded-[6px] w-full h-[40px]"
                />
                <div className="w-[72%] h-full flex rounded-[5px] text-[#37352f]">
                  <SkeletonElement
                    width={280}
                    height={40}
                    className="!rounded-[6px] w-full h-[40px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default skeleton;
