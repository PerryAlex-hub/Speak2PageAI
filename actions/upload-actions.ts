"use server";
import OpenAI from "openai";
import { Buffer } from "buffer";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function transcribeUploadedFile(
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
        body: formData as any,
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
    return {
      success: false,
      message: error instanceof Error ? error.message : "Transcription failed",
      data: null,
    };
  }
}
