"use client";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import z from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useUploadThing } from "@/utils/uploadthing";
import transcribeUploadedFile from "@/actions/upload-actions";

const schema = z.object({
  file: z
    .instanceof(File, { message: "Please upload a valid file." })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      "File size must not exceed 20MB.",
    )
    .refine(
      (file) =>
        file.type.startsWith("audio/") || file.type.startsWith("video/"),
      "Only audio and video files are allowed.",
    ),
});

const UploadForm = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const { startUpload } = useUploadThing("videoOrAudioUploader", {
    onClientUploadComplete: (res) => {
      console.log("Files: ", res);
      // uploading finished; transcription may start afterwards
      setIsUploading(false);
      toast.success("Upload Completed");
    },
    onUploadError: (error: Error) => {
      console.error(`ERROR! ${error.message}`);
      setIsUploading(false);
      toast.error(`Upload Error: ${error.message}`, { position: "top-right" });
    },
    onUploadBegin: () => {
      setIsUploading(true);
      toast.info("Upload Started");
    },
  });

  const handleTranscribe = async (formData: FormData) => {
    const file = formData.get("file") as File;
    const validateFields = schema.safeParse({ file });

    if (!validateFields.success) {
      console.log(
        "ValidatedFields Error: ",
        validateFields.error.flatten().fieldErrors,
      );
      toast.error("Something went wrong", {
        description:
          validateFields.error.flatten().fieldErrors.file?.[0] ??
          "Invalid File",
        position: "top-right",
      });
    }

    if (file) {
      // start upload (will flip isUploading via callbacks)
      const resp = await startUpload([file]);
      console.log({ resp });

      if (!resp) {
        setIsUploading(false);
        toast.error("Upload failed. Please try again.");
        return;
      }

      // begin transcription
      setIsTranscribing(true);
      toast.info("Transcription is in progress", {
        description:
          "Your file is being transcribed. This may take a few minutes.",
        position: "top-right",
      });

      try {
        const result = await transcribeUploadedFile(resp);
        console.log({ result });
        if (!result?.success) {
          toast.error(result?.message ?? "Transcription failed");
        }
      } catch (err) {
        console.error(err);
        toast.error("Transcription failed. Please try again.");
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  return (
    <form className="flex flex-col gap-6" action={handleTranscribe}>
      <div className="flex justify-end items-center gap-1.5">
        <Input
          id="file"
          name="file"
          type="file"
          accept="audio/*, video/*"
          required
          disabled={isUploading || isTranscribing}
        />
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isUploading || isTranscribing}
          aria-busy={isUploading || isTranscribing}
        >
          {isUploading || isTranscribing ? "Processing..." : "Transcribe"}
        </Button>
      </div>
    </form>
  );
};

export default UploadForm;
