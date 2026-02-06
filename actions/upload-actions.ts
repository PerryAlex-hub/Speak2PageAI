"use server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";
import getDbConnection from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  WRITING_TONES,
  WORD_COUNT_OPTIONS,
  type WritingTone,
  type WordCountOption,
} from "@/lib/blog-options";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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

function getToneDetails(toneId: WritingTone) {
  return WRITING_TONES.find((t) => t.id === toneId) ?? WRITING_TONES[1]; // default to conversational
}

function getWordCount(wordCountId: WordCountOption) {
  return WORD_COUNT_OPTIONS.find((w) => w.id === wordCountId)?.words ?? 900; // default to 900
}

async function generateBlogPost({
  transcriptions,
  userPosts,
  tone,
  wordCount,
}: {
  transcriptions: string;
  userPosts: string;
  tone: WritingTone;
  wordCount: number;
}) {
  const toneDetails = getToneDetails(tone);

  const systemPrompt = `You are the most accomplished content writer alive. With 50+ years in the craft, your blog posts have been read by millions. Your secret? You write naturally, engagingly, and in a way that keeps readers hooked from start to finish.

WRITING TONE: ${toneDetails.name.toUpperCase()}
${toneDetails.description}

YOUR WRITING DNA:
• Every paragraph earns its place. If it doesn't move the reader forward, it's gone.
• You write tight. No fluff. No filler. Just value.
• Your rhythm is musical. Short punches. Then longer thoughts that let ideas breathe before landing with impact.
• You use specifics, never generalities. Concrete examples. Vivid details.

READER ENGAGEMENT TECHNIQUE (USE THIS):
You engage readers by anticipating questions they might be thinking and then answering them. This makes your writing feel like a conversation. Use this technique 2 to 3 times per post in different sections.

Examples of how to do this:
• "So why does this matter? Because when you understand X, you can finally Y."
• "But wait, doesn't that contradict Z? Not exactly. Here's the nuance..."
• "You might be wondering how this applies to you. The answer is simpler than you'd think."

UNBREAKABLE RULES:
1. ZERO DASHES. Never use em dashes (—), en dashes (–), double hyphens (--), or spaced hyphens ( - ). Restructure sentences using commas, periods, semicolons, or parentheses. Only use hyphens in compound words like "well-known" or "high-quality".
2. NO FABRICATION. Everything must come from the transcript. Don't invent stories, anecdotes, or experiences.
3. NATURAL LANGUAGE. Use contractions (don't, won't, I've, we're, it's). Write how humans speak.
4. BANNED FOREVER: "In today's world", "It's important to note", "In conclusion", "Let's dive in", "Without further ado", "In this article", "Firstly/Secondly/Lastly", "game-changer", "dive deep", "landscape", "paradigm", "leverage", "at the end of the day", "it goes without saying", "needless to say", "crucial", "vital", "essential" (filler), "here's the thing", "here's the deal".

TARGET LENGTH: ${wordCount} words. This is important. Aim for approximately ${wordCount} words.`;

  const userPrompt = `${userPosts ? `MATCH THIS WRITING VOICE (my previous posts for reference):\n\n${userPosts}\n\n---\n\n` : ""}TRANSFORM THIS TRANSCRIPTION INTO A STANDOUT BLOG POST.

TARGET LENGTH: Approximately ${wordCount} words. ${wordCount <= 500 ? "Keep it concise and punchy." : wordCount >= 1500 ? "Make it comprehensive and thorough." : "Balance depth with readability."}

TITLE REQUIREMENTS:
• Magnetic and specific. Clear value.
• Under 60 characters.
• Makes someone stop scrolling immediately.

OPENING:
• First sentence hooks instantly. Bold claim, surprising insight, or pattern interrupt.
• NO warm-up. NO "Have you ever wondered..." Just start strong.
• Pull readers in within three sentences.

STRUCTURE:
• ${wordCount <= 500 ? "2 to 3" : wordCount >= 1500 ? "5 to 7" : "3 to 5"} compelling subheadings (## level) that are interesting, not boring labels
• Smooth transitions between sections

BODY:
• Develop ideas from the transcript, don't just list them.
• Explain the "why" behind the "what".
• Use concrete examples and specifics.
• **Bold key phrases** for skimmers.
• Use > blockquotes sparingly for truly powerful lines.
• Use the question-and-answer engagement technique 2 to 3 times throughout the post.

CLOSING:
• Don't summarize. Leave readers with a thought that lingers or an action to take.
• Short and punchy. 2 to 3 sentences max.

FORMATTING:
• Short paragraphs: 2 to 3 sentences.
• Varied sentence lengths. Some short. Some flowing.
• White space is your friend.

OUTPUT FORMAT:
# [Title]

[Hook immediately. No meta-commentary.]

[Focused, valuable content...]

TRANSCRIPTION:
${transcriptions}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    },
  });

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: `Got it. I'll write in a ${toneDetails.name.toLowerCase()} tone, targeting approximately ${wordCount} words. No dashes of any kind. I'll actively use the question-and-answer engagement technique 2 to 3 times per post. Magnetic titles, immediate hooks, real value. Ready for the transcription.`,
          },
        ],
      },
    ],
  });

  const result = await chat.sendMessage(userPrompt);
  const response = result.response;

  return response.text();
}

export async function generateBlogPostAction({
  transcriptions,
  userId,
  tone = "conversational",
  wordCountOption = "medium",
}: {
  transcriptions: { text: string };
  userId: string;
  tone?: WritingTone;
  wordCountOption?: WordCountOption;
}) {
  const userPosts = (await getLatestPosts(userId)) ?? "";
  const wordCount = getWordCount(wordCountOption);
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
  }
  if (transcriptions) {
    const blogPost = await generateBlogPost({
      transcriptions: transcriptions.text,
      userPosts,
      tone,
      wordCount,
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
