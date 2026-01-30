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

    
    // Enforce 20MB limit server-side before attempting transcription
    const MAX_BYTES = 20 * 1024 * 1024;
    if (buffer.byteLength > MAX_BYTES) {
      return {
        success: false,
        message: "File size exceeds the 20MB limit and cannot be transcribed.",
        data: null,
      };
    }

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
Please convert the following transcription into a high-quality, professional blog post using Markdown formatting. Follow these instructions carefully:

1. Start with a **SEO-optimized, catchy title** on the first line that sparks curiosity and encourages clicks.
2. Add **a new line** after the title.
3. Begin with an **engaging introduction paragraph** that hooks the reader, clearly explains the topic, and sets the tone for the article.
4. Structure the main content into **clear sections** using Markdown headings (## for main sections, ### for subheadings).
5. Include **bullet points, numbered lists, and tables** where appropriate to make complex ideas easy to digest.
6. Add **examples, analogies, or mini case studies** where relevant to make the content practical and relatable.
7. Use **transitional sentences and storytelling techniques** to maintain flow between sections.
8. Write a **conclusion paragraph** that summarizes key points, reinforces the value, and provides a call-to-action if applicable.
9. Maintain an **informative, authoritative, yet approachable tone** throughout. Avoid generic phrasing.
10. **Emulate my writing style, tone, and recurring patterns** from my previous posts — maintain the same sentence rhythm, vocabulary, and energy.
11. Ensure the content is **original, creative, and hard to distinguish from content written by a human expert**.
12. Use **natural language, rhetorical questions, and varied sentence structures** to make the post engaging.
13. Format all Markdown elements correctly — headings, lists, bold/italics, links, and code blocks if needed.

Produce a final, polished Markdown blog post that reads like it was written by an expert content writer with deep knowledge of the subject.

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
    const [user] =
      await sql`SELECT price_id FROM users WHERE user_id = ${userId}`;
    const priceId = user?.price_id ?? "free";
    if (priceId === "free") {
      type CountResult = { count: number };
      const [{ count }] =
        (await sql`SELECT COUNT(*)::int AS count FROM posts WHERE user_id = ${userId}`) as CountResult[];
      const postCount = count ?? 0;
      if (postCount >= 3) {
        interface LimitExceededError extends Error {
          code: string;
        }
        const err = new Error("LIMIT_EXCEEDED") as LimitExceededError;
        err.code = "LIMIT_EXCEEDED";
        throw err;
      }
    }
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "LIMIT_EXCEEDED") throw e;
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
  if (postId) {
    revalidatePath(`/posts/${postId}`);
    redirect(`/posts/${postId}`);
  } else {
    return {
      success: false,
      message: "Failed to save blog post.",
    };
  }
}
