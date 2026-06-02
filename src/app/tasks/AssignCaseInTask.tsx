import { getAllCases } from "@/apiReq/newAPIs/cases";
import { updateTaskCaseId } from "@/apiReq/newAPIs/task-new";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mergeFirstLetters } from "@/utils/stringOpeartion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FaUser } from "react-icons/fa6";

export default function AssignCaseInTask({
  taskInfo,
  setTaskInfo,
  isNewTask,
  setLinkedCase,
}: {
  taskInfo: any;
  setTaskInfo?: any;
  isNewTask?: boolean;
  setLinkedCase?: any;
}) {
  const [casesOptions, setCasesOptions] = useState<any[]>([]);
  const [AssigneOpen, setAssigneOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(taskInfo?.case_id || "");

  const formatCaseName = (caseData: any) => {
    const petitioner = Array.isArray(caseData?.petitioner)
      ? caseData.petitioner.filter(Boolean).join(", ")
      : caseData?.petitioner || "";
    const respondent = Array.isArray(caseData?.respondent)
      ? caseData.respondent.filter(Boolean).join(", ")
      : caseData?.respondent || "";
    const name = `${petitioner} v. ${respondent}`.trim();
    return name === "v." ? "" : name;
  };

  const getCaseLabel = (caseData: any) =>
    caseData?.registration_no ||
    caseData?.cin_no ||
    caseData?.filing_no ||
    formatCaseName(caseData) ||
    "Unknown";

  useEffect(() => {
    const fetchCases = async () => {
      const res = await getAllCases();
      if (res.success) {
        setCasesOptions(res.data);
      }
    };
    fetchCases();
  }, []);

  // Update selectedCaseId when taskInfo changes
  useEffect(() => {
    setSelectedCaseId(taskInfo?.case_id || "");
  }, [taskInfo?.case_id]);

  const selectedAssignee = useMemo(() => {
    if (!taskInfo) {
      return { name: "unassigned", id: "" };
    }

    const linked_case =
      casesOptions && casesOptions.length > 0
        ? casesOptions.filter((it) => it.id === (selectedCaseId || taskInfo.case_id))
        : [];

    if (linked_case.length > 0) {
      const caseData = linked_case[0];
      const caseLabel = getCaseLabel(caseData);
      return {
        id: caseData.id,
        name: caseLabel,
      };
    } else {
      return {
        id: "",
        name: "unassigned",
      };
    }
  }, [selectedCaseId, taskInfo?.case_id, casesOptions]);

  const assignCaseToTask = async (case_data) => {
    if (isNewTask) {
      const caseLabel = getCaseLabel(case_data);
      setLinkedCase({ ...case_data, name: caseLabel });
      setAssigneOpen(false);

      return;
    } else {
      if (selectedAssignee?.id !== case_data?.id) {
        const res = await updateTaskCaseId(taskInfo, case_data.id || null);
        if (res.success) {
          // Update the local state to trigger re-render
          setSelectedCaseId(case_data.id);
          setTaskInfo((prev) => ({
            ...prev,
            case_id: case_data.id,
          }));
          setAssigneOpen(false);
        } else {
          // Handle error case - maybe show a notification to the user
          console.error("Failed to update task case ID:", res.error);
        }
      }
    }
  };

  return (
    <Popover open={AssigneOpen} onOpenChange={setAssigneOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={AssigneOpen}
          className="base:w-[65%] tv:w-[72%]  border-none outline-none shadow-none justify-between"
        >
          {selectedAssignee ? (
            <div className="flex ml-[-8px] items-center gap-3">
              {selectedAssignee.name === "unassigned" ? (
                <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                  <FaUser size={15} color="#c0c7d1" />
                </div>
              ) : (
                <div className="bg-[#ff9920] rounded-full flex justify-center items-center text-[#212e42] w-[26px] h-[26px]">
                  <h2 className="!font-[500] !text-[0.67rem]">
                    {selectedAssignee.name &&
                      mergeFirstLetters(selectedAssignee.name)}
                  </h2>
                </div>
              )}
              <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground capitalize text-[#364258]">
                {selectedAssignee.name}
              </p>
            </div>
          ) : (
            "Select Case..."
          )}
          <ChevronsUpDown className="ml-8 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] max-h-[320px] overflow-hidden p-0 bg-white shadow-xl rounded-lg z-[1000000] border">
        <Command className="p-2">
          <CommandInput
            placeholder="Search case..."
            className="outline-none border-0"
          />
          <CommandList className="max-h-[260px] overflow-y-auto">
            <CommandEmpty className="text-sm">No case found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="unassigned"
                value="unassigned"
                onSelect={(currentValue) => {
                  assignCaseToTask({
                    name: "unassigned",
                    id: "",
                  });
                  setAssigneOpen(false);
                }}
                className="flex items-center justify-start gap-1 mt-1 p-1 flex-nowrap "
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedAssignee.name === "unassigned"
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <div className="flex items-center gap-3">
                  <div className="bg-[#edeef3] rounded-full flex justify-center items-center w-[26px] h-[26px]">
                    <FaUser size={15} color="#c0c7d1" />
                  </div>
                  <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground">
                    Unassigned
                  </p>
                </div>
              </CommandItem>
              {casesOptions !== null &&
                casesOptions.map((case_data: any) => {
                  const caseLabel = getCaseLabel(case_data);
                  return (
                  <CommandItem
                    key={case_data.id}
                    value={caseLabel}
                    onSelect={(currentValue) => {
                      assignCaseToTask(case_data);
                    }}
                    className="flex items-center justify-start gap-1 p-2 flex-nowrap cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAssignee.id === case_data.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-3">
                      <div className="bg-[#ff9920] rounded-full flex justify-center items-center text-[#212e42] w-[26px] h-[26px] uppercase">
                        <h2 className="!font-[500] !text-[0.67rem]">
                          {caseLabel && mergeFirstLetters(caseLabel)}
                        </h2>
                      </div>
                      <p className="text-[0.8rem] tracking-wide font-[500] text-muted-foreground">
                        {caseLabel}
                      </p>
                    </div>
                  </CommandItem>
                )})}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
