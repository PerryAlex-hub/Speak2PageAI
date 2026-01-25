import ContentEditor from "@/components/content/content-editor";
import getDbConnection from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PostsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const sql = await getDbConnection();

  const posts =
    await sql`SELECT * from posts where user_id = ${user.id} and id = ${id}`;

  // normalize DB result to the shape expected by ContentEditor
  type PostRow = { id: number; title: string | null; content: string | null };
  const typedPosts = (posts as PostRow[]).map((p) => ({
    id: String(p.id),
    title: String(p.title ?? ""),
    content: String(p.content ?? ""),
  })) as { id: string; title: string; content: string }[];

  return (
    <div className="mx-auto w-full max-w-7xl px-2.5 lg:px-0 mb-12 mt-28">
      <ContentEditor posts={typedPosts} />
    </div>
  );
}
