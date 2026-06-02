export const renderTaskStatusChip = (status: number) => {
  switch (status) {
    case 0:
      return (
        <div className="inline-flex items-center bg-[#F3F2EF] text-[#6b6b6b] text-xs font-medium rounded-full px-3 py-1">
          TO DO
        </div>
      );
    case 1:
      return (
        <div className="inline-flex items-center bg-[#FFFAEB] text-[#B45309] text-xs font-medium rounded-full px-3 py-1">
          IN PROGRESS
        </div>
      );
    case 2:
      return (
        <div className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#4A5FD4] text-xs font-medium rounded-full px-3 py-1">
          <span>●</span>
          IN VERIFY
        </div>
      );
    case 3:
      return (
        <div className="inline-flex items-center bg-[#EDFAF3] text-[#1D9E75] text-xs font-medium rounded-full px-3 py-1">
          DONE
        </div>
      );

    default:
      return "";
  }
};
