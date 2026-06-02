import React from "react";
import SkeletonElement from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";

type SkeletonForTableProps = {
  showIndexColumn?: boolean;
};

const Skeleton = ({ showIndexColumn = true }: SkeletonForTableProps) => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index: number) => (
        <TableRow
          key={index}
          className="hover:bg-[#f9fafb] !h-[60px] cursor-pointer"
        >
          <TableCell>
            <SkeletonElement width={22} height={22} className="!rounded-[6px]" />
          </TableCell>
          {showIndexColumn && (
            <TableCell>
              <SkeletonElement width={24} height={18} className="!rounded-[6px]" />
            </TableCell>
          )}
          <TableCell>
            <SkeletonElement
              width={160}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement
              width={90}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement
              width={110}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement
              width={100}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement
              width={100}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement
              width={100}
              height={25}
              className="!rounded-[8px]"
            />
          </TableCell>
          <TableCell>
            <SkeletonElement width={20} height={20} className="!rounded-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export default Skeleton;
