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

// Writing style templates for variety - each post gets a random style
const WRITING_STYLES = [
  {
    name: "storyteller",
    description:
      "Open with a personal anecdote or vivid scene. Write like you're telling a friend about something fascinating you discovered. Use 'I', share doubts, include moments of realization.",
    hookStyle:
      "Start with a surprising personal moment or a 'I never expected...' opener",
  },
  {
    name: "provocateur",
    description:
      "Challenge conventional wisdom. Start with a controversial take. Use rhetorical questions that make readers stop scrolling. Be bold but back it up.",
    hookStyle:
      "Open with 'Everything you know about X is wrong' or 'Here's what nobody tells you about...'",
  },
  {
    name: "curator",
    description:
      "Position yourself as someone who's done the research. Share insights like you're letting readers in on secrets. Use phrases like 'After talking to 50 experts...' or 'I spent 3 months researching...'",
    hookStyle:
      "Start with 'I spent X hours/days/weeks so you don't have to' or a surprising stat",
  },
  {
    name: "conversationalist",
    description:
      "Write like a casual coffee chat. Short paragraphs. Incomplete sentences sometimes. Ask questions. React to your own points ('Wild, right?'). Use parentheticals for asides.",
    hookStyle:
      "Open with a question that hits close to home or 'Can we talk about...'",
  },
  {
    name: "analyst",
    description:
      "Break things down methodically but keep it engaging. Use frameworks and mental models. Include 'Here's the thing most people miss...' moments.",
    hookStyle:
      "Start with a pattern you've noticed or 'There's a hidden framework behind...'",
  },
];

// Title formulas that work on Medium/Substack
const TITLE_FORMULAS = [
  "The [Unexpected Adjective] Truth About [Topic] That Changed How I [Action]",
  "I [Did Something] for [Time Period]. Here's What Actually Happened.",
  "Stop [Common Behavior]. Do This Instead.",
  "What [Unexpected Source] Taught Me About [Topic]",
  "[Number] [Topic] Lessons I Learned the Hard Way",
  "The [Topic] Mistake That Cost Me [Something Valuable]",
  "Why [Contrarian Take] (And What to Do About It)",
  "How [Simple Thing] Became My Secret Weapon for [Outcome]",
];

function getRandomStyle() {
  return WRITING_STYLES[Math.floor(Math.random() * WRITING_STYLES.length)];
}

function getRandomTitleFormulas() {
  // Return 3 random formulas for inspiration
  const shuffled = [...TITLE_FORMULAS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).join("\n- ");
}

async function generateBlogPost({
  transcriptions,
  userPosts,
}: {
  transcriptions: string;
  userPosts: string;
}) {
  const style = getRandomStyle();
  const titleFormulas = getRandomTitleFormulas();

  const systemPrompt = `You are a viral content writer who creates posts that dominate Medium, Substack, and LinkedIn. Your content feels deeply human, personal, and impossible to detect as AI-written.

CRITICAL ANTI-AI-DETECTION RULES:
- Write like you're a real person with real experiences, doubts, and opinions
- Use contractions naturally (don't, won't, I've, we're, it's)
- Include imperfect phrasing - not every sentence needs to be grammatically perfect
- Vary sentence length dramatically: Some short. Others should flow longer with multiple clauses that meander a bit before reaching their point.
- Add personal interjections: "honestly", "look", "here's the thing", "I'll be real"
- Include self-corrections: "Actually, let me rephrase that..." or "Well, sort of."
- NEVER use em dashes (—), en dashes (–), double hyphens (--), or standalone hyphens surrounded by spaces ( - ). Use commas, periods, or parentheses instead. Only use hyphens in compound words like "well-known" or "real-time".
- Reference specific (but generic) details: "last Tuesday", "my friend Sarah", "this one coffee shop I go to"
- Express uncertainty sometimes: "I think", "I'm not 100% sure but", "from what I've seen"
- Break the fourth wall occasionally: "stay with me here", "I know that sounds crazy"
- NEVER use these AI-giveaway phrases: "In today's world", "It's important to note", "In conclusion", "Let's dive in", "Without further ado", "In this article", "Firstly/Secondly/Lastly", "game-changer", "dive deep", "landscape", "paradigm", "leverage"
- Avoid starting sentences with "This" too often
- Don't use colons (:) to introduce lists mid-sentence. Just use commas or write it naturally.

YOUR WRITING STYLE FOR THIS POST: ${style.name}
${style.description}

HOOK APPROACH: ${style.hookStyle}`;

  const userPrompt = `${userPosts ? `Here's how I usually write (match my voice and energy, not the structure):\n\n${userPosts}\n\n---\n\n` : ""}Convert this transcription into a blog post that could go viral on Medium or Substack.

TITLE REQUIREMENTS:
- Must stop the scroll. Make it impossible to NOT click.
- Use one of these proven formulas as inspiration (adapt, don't copy):
- ${titleFormulas}
- Keep it under 60 characters if possible
- No clickbait that doesn't deliver - the content must match the promise

HOOK/OPENING (First 2-3 sentences):
- This is the most important part. 90% of readers decide to stay or leave here.
- Start in the middle of action, with a bold claim, or a pattern interrupt
- NO throat-clearing. NO "Have you ever wondered..." NO generic setups.
- Make readers feel like they've been thinking about this exact thing

STRUCTURE:
- Use subheadings that are themselves interesting (not just "Introduction", "Point 1")
- Each section should have a mini-hook
- Include at least one unexpected insight or counterintuitive point
- Add a "quotable" line that readers would want to highlight/share
- End with something that lingers - a question, a challenge, or a perspective shift

FORMATTING FOR READABILITY:
- Short paragraphs (2-4 sentences max)
- Strategic bold for key phrases readers might skim for
- Use > blockquotes for memorable lines or key takeaways
- Lists only when they genuinely help, not as filler

VOICE:
- Write like a smart friend explaining something over drinks
- Be specific and concrete, not abstract and generic
- Include your genuine reaction to the ideas ("this blew my mind", "I was skeptical at first")
- Don't over-explain. Trust the reader's intelligence.

OUTPUT FORMAT:
- Start with the title (# heading)
- Then a blank line
- Then dive straight into the hook - no meta-commentary about what you're going to write

Here's the transcription to transform:
${transcriptions}`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "gpt-4o-mini",
    temperature: 0.9, // Higher temperature for more creative, varied output
    max_tokens: 2000, // More tokens for richer content
    presence_penalty: 0.6, // Encourages more diverse vocabulary
    frequency_penalty: 0.4, // Reduces repetitive phrases
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
