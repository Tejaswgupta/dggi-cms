// "use client";

// import { getUserDetailById } from "@/apiReq/newAPIs/roadmaps";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useEffect, useState } from "react";
// import NewCommentQuill from "./NewCommentQuill";
// import { NewCommentQuillDisplay } from "./NewCommentQuillDisplay";

// // Import audit and ownership components
// import { fetchComments } from "@/apiReq/newAPIs/comment";
// import AuditLogTimeline from "@/components/audit-logs/AuditLogTimeline";
// // import TaskOwnershipTimeline from "@/components/task-ownership/TaskOwnershipTimeline";
// import { getAllUsers, getCurrentUserDetail } from "@/hooks/useWorkspaceUsers";
// import { Comment, User } from "./types";

// interface NewCommentPannelProps {
//   taskId: string;
//   taskName?: string;
// }

// function NewCommentPanel({ taskId, taskName }: NewCommentPannelProps) {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [comments, setComments] = useState<Comment[]>([]);
//   const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
//   const [allUsers, setAllUsers] = useState<User[]>([]);

//   useEffect(() => {
//     const getAllData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);

//         // Fetch all users
//         const { data: allUsersData } = await getAllUsers();
//         if (allUsersData) {
//           const users: User[] = allUsersData.map((d: any) => ({
//             name: d.name,
//             id: d.id,
//             email: d.email,
//           }));
//           setAllUsers(users);
//         }

//         // Fetch current user
//         const { data: currentUser } = await getCurrentUserDetail();
//         if (currentUser) {
//           setLoggedInUser({
//             name: currentUser.name,
//             id: currentUser.id,
//             email: currentUser.email,
//           });
//         }

//         // Fetch comments
//         const { data: commentsData } = await fetchComments(taskId, "task_id");

//         if (commentsData && commentsData.length > 0) {
//           const fetchedUsers: User[] = [];
//           const comments = await Promise.all(
//             commentsData.map(async (d: any): Promise<Comment> => {
//               const userId = d.added_by;

//               let user = fetchedUsers.find((u) => u.id === userId);
//               if (!user) {
//                 user = await getUserDetailById(userId);
//                 if (user) {
//                   fetchedUsers.push(user);
//                 }
//               }

//               return {
//                 user: user || { name: "Unknown User", id: userId, email: "" },
//                 comment: d.comment,
//                 id: d.comment_id,
//                 linkId: d.task_id,
//                 quote: d.quote || "",
//                 selection: d.selection,
//                 subComments: [],
//                 created_at: d.created_at,
//               };
//             }),
//           );

//           setComments(comments);
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setError("Failed to load comments. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     getAllData();
//   }, []);

//   const handleSetComments = (newComments: Comment[]) => {
//     setComments([...newComments]);
//   };

//   const handleAddComment = (newComment: Comment) => {
//     setComments((prev) => [newComment, ...prev]);
//   };

//   return (
//     <div className="w-full flex flex-col gap-8">
//       <Tabs defaultValue="comments" className="w-full">
//         <TabsList className="border-b border-gray-200 w-full flex h-auto p-0 bg-transparent gap-8">
//           <TabsTrigger
//             value="comments"
//             className="border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-2 rounded-none font-medium text-base data-[state=active]:shadow-none"
//           >
//             Comments
//           </TabsTrigger>
//           <TabsTrigger
//             value="updates"
//             className="border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-2 rounded-none font-medium text-base data-[state=active]:shadow-none"
//           >
//             Updates
//           </TabsTrigger>
//           <TabsTrigger
//             value="ownership"
//             className="border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-2 rounded-none font-medium text-base data-[state=active]:shadow-none"
//           >
//             Task Ownership
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="comments" className="w-full mt-6">
//           <div className="w-full flex flex-col gap-4 mt-8">
//             {isLoading && (
//               <div className="flex items-center justify-center py-8">
//                 <div className="text-gray-500">Loading comments...</div>
//               </div>
//             )}
//             {error && (
//               <div className="flex items-center justify-center py-8">
//                 <div className="text-red-500">{error}</div>
//               </div>
//             )}
//             {!isLoading && !error && comments.length === 0 && (
//               <div className="flex items-center justify-center py-8">
//                 <div className="text-gray-500">No comments yet</div>
//               </div>
//             )}
//             {!isLoading && !error && comments.length > 0 && (
//               <div className="w-full flex flex-col gap-4">
//                 {comments.map((comment, idx) => {
//                   return (
//                     <NewCommentQuillDisplay
//                       key={idx}
//                       comment={comment}
//                       comments={comments}
//                       setComments={handleSetComments}
//                       loggedInUser={loggedInUser}
//                       allUsers={allUsers}
//                     />
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//           <div className="w-full mt-[5%]">
//             <NewCommentQuill
//               taskId={taskId}
//               loggedInUser={loggedInUser}
//               allUsers={allUsers}
//               onCommentAdd={handleAddComment}
//               comments={comments}
//             />
//           </div>
//         </TabsContent>

//         <TabsContent value="updates" className="w-full mt-6">
//           <div className="w-full flex flex-col gap-4">
//             <AuditLogTimeline
//               recordId={taskId}
//               tableName="votum_tasks"
//               showFilters={false}
//               limit={100}
//             />
//           </div>
//         </TabsContent>

//         <TabsContent value="ownership" className="w-full mt-6">
//           <div className="w-full flex flex-col gap-4"></div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

// export default NewCommentPanel;
