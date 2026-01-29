"use server";
import OpenAI from "openai";
import { Buffer } from "buffer";
import getDbConnection from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeUploadedFile(
  resp: {
    serverData: { userId: string; file: { url: string; name: string } };
  }[],
) {
  if (!resp) {
    return {
      success: false,
      message: "File upload failed",
    };
  }

  const {
    serverData: {
      userId,
      file: { url: fileUrl, name: fileName },
    },
  } = resp[0];

  if (!fileUrl || !fileName) {
    return {
      success: false,
      message: "Invalid file data",
      data: null,
    };
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch file");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const formData = new FormData();
    // Use a Blob so filename is preserved when sending multipart/form-data
    const fileBlob = new Blob([buffer]);
    formData.append("file", fileBlob, fileName);
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");

    const openaiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        },
        body: formData,
      },
    );

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(
        `OpenAI transcription failed: ${openaiRes.status} ${errText}`,
      );
    }

    const transcriptions = await openaiRes.text();

    console.log({ transcriptions });
    return {
      success: true,
      message: "Transcription successful",
      data: { transcriptions, userId },
    };
  } catch (error) {
    console.error("Transcription error:", error);
    if (error instanceof OpenAI.APIError && error.status === 413) {
      return {
        success: false,
        message: "File size exceeds the maximum limit for transcription.",
        data: null,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Transcription failed",
      data: null,
    };
  }
}

async function saveBlogPost(userId: string, title: string, content: string) {
  try {
    const sql = await getDbConnection();
    const [insertedPost] =
      await sql`INSERT INTO posts (user_id, title, content) VALUES (${userId}, ${title}, ${content}) RETURNING id`;
    return insertedPost.id;
  } catch (error) {
    console.error("Error saving blog post:", error);
  }
}

async function getLatestPosts(userId: string) {
  try {
    const sql = await getDbConnection();
    const posts =
      await sql`SELECT content from posts where user_id = ${userId} ORDER BY created_at DESC LIMIT 3`;

    return posts.map((post) => post.content).join("\n\n");
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return "";
  }
}

async function generateBlogPost({
  transcriptions,
  userPosts,
}: {
  transcriptions: string;
  userPosts: string;
}) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a skilled content writer that converts audio transcriptions into well-structured, engaging blog posts in Markdown format. Create a comprehensive blog post with a catchy title, introduction, main body with multiple sections, and a conclusion. Analyze the user's writing style from their previous posts and emulate their tone and style in the new post. Keep the tone casual and professional.",
      },
      {
        role: "user",
        content: `Here are some of my previous blog posts for reference:

${userPosts}

Please convert the following transcription into a well-structured blog post using Markdown formatting. Follow this structure:

1. Start with a SEO friendly catchy title on the first line.
2. Add two newlines after the title.
3. Write an engaging introduction paragraph.
4. Create multiple sections for the main content, using appropriate headings (##, ###).
5. Include relevant subheadings within sections if needed.
6. Use bullet points or numbered lists where appropriate.
7. Add a conclusion paragraph at the end.
8. Ensure the content is informative, well-organized, and easy to read.
9. Emulate my writing style, tone, and any recurring patterns you notice from my previous posts.

Here's the transcription to convert: ${transcriptions}`,
      },
    ],
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content;
}

export async function generateBlogPostAction({
  transcriptions,
  userId,
}: {
  transcriptions: { text: string };
  userId: string;
}) {
  const userPosts = (await getLatestPosts(userId)) ?? "";
  let postId = null;
  // enforce plan limits: free users are limited to 3 posts/transcriptions
  try {
    const sql = await getDbConnection();
    const [user] = await sql`SELECT price_id FROM users WHERE user_id = ${userId}`;
    const priceId = user?.price_id ?? "free";
    if (priceId === "free") {
      const [{ count }]: any = await sql`SELECT COUNT(*)::int AS count FROM posts WHERE user_id = ${userId}`;
      const postCount = typeof count === "string" ? parseInt(count, 10) : count ?? 0;
      if (postCount >= 3) {
        const err: any = new Error("LIMIT_EXCEEDED");
        err.code = "LIMIT_EXCEEDED";
        throw err;
      }
    }
  } catch (e) {
    if ((e as any)?.code === "LIMIT_EXCEEDED") throw e;
    console.error("Error checking plan limits:", e);
    // proceed — if DB is unreachable we attempt generation but this should be rare
  }
  if (transcriptions) {
    const blogPost = await generateBlogPost({
      transcriptions: transcriptions.text,
      userPosts,
    });
    console.log({ blogPost });
    if (!blogPost) {
      return {
        success: false,
        message: "Blog post generation failed, please try again...",
      };
    }

    const [title] = blogPost?.split("\n\n") || [];

    if (userId) {
      postId = await saveBlogPost(userId, title, blogPost);
    }
  }
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
