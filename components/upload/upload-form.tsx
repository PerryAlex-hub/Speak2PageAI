"use client";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import z from "zod";
import { toast } from "sonner";

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

const uploadForm = () => {
  const handleTranscribe = async (formData: FormData) => {
    const file = formData.get("file") as File;
    const validateFields = schema.safeParse({ file });

    if (!validateFields.success) {
      console.log(
        "ValidatedFields Error: ",
        validateFields.error.flatten().fieldErrors,
      );
      toast.error("Something went wrong", {
        
        description: validateFields.error.flatten().fieldErrors.file?.[0] ?? "Invalid File",
        position: "top-right",
      })
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
        />
        <Button className="bg-purple-600 hover:bg-purple-700">
          Transcribe
        </Button>
      </div>
    </form>
  );
};

export default uploadForm;
