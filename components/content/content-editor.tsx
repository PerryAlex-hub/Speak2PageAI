"use client";

import { useActionState, useCallback, useState, useEffect } from "react";
import BgGradient from "../common/bg-gradient";
import { ForwardRefEditor } from "./forward-ref-editor";
import { useFormStatus } from "react-dom";
import { updatePostAction } from "@/actions/edit-actions";
import { Button } from "../ui/button";
import { Download, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className={`w-full sm:w-40 bg-linear-to-r from-purple-900 to-indigo-600 hover:from-purple-600 hover:to-indigo-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2`}
      disabled={pending}
    >
      {pending ? (
        <span className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...
        </span>
      ) : (
        <span className="flex items-center justify-center">
          <Edit2 className="w-5 h-5 mr-2" />
          Update Text
        </span>
      )}
    </Button>
  );
}

const initialState = {
  success: false,
};

type UploadState = {
  success: boolean;
};

type UploadAction = (
  state: UploadState,
  formData: FormData,
) => Promise<UploadState>;

// Type definitions for markdown tokens
interface MarkdownToken {
  type: string;
  text?: string;
  depth?: number;
  items?: Array<{ text: string }>;
}

interface MarkedLib {
  lexer: (src: string) => MarkdownToken[];
  parse?: (src: string) => string;
}

// Type definitions for jsPDF
interface JsPDFInstance {
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  setFont: (font: string, style: string) => void;
  setFontSize: (size: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  text: (text: string, x: number, y: number) => void;
  addPage: () => void;
  output: (type: string) => Blob;
}

interface JsPDFConstructor {
  new (options: { unit: string; format: string }): JsPDFInstance;
}

interface JsPDFModule {
  jsPDF?: JsPDFConstructor;
  default?: JsPDFConstructor;
}

export default function ContentEditor({
  posts,
}: {
  posts: Array<{ content: string; title: string; id: string }>;
}) {
  const [content, setContent] = useState(posts[0].content);
  const [exportFormat, setExportFormat] = useState<"markdown" | "pdf" | "docx">(
    "markdown",
  );

  const updatedPostActionWithId = updatePostAction.bind(null, {
    postId: posts[0].id,
    content,
  });

  const [state, formAction] = useActionState<UploadState, FormData>(
    updatedPostActionWithId as unknown as UploadAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Post updated successfully!", { position: "top-right" });
    }
  }, [state?.success]);

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleExport = useCallback(() => {
    const baseName = (posts[0].title || "blog-post")
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 120);

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    (async () => {
      if (exportFormat === "markdown") {
        const filename = `${baseName}.md`;
        const blob = new Blob([content], {
          type: "text/markdown;charset=utf-8",
        });
        downloadBlob(blob, filename);
        return;
      }

      if (exportFormat === "pdf") {
        try {
          const [{ marked }, jsPDFModule] = await Promise.all([
            import("marked"),
            import("jspdf"),
          ]);

          const markedLib = marked as unknown as MarkedLib;
          const JsPDFConstructor =
            (jsPDFModule as JsPDFModule)?.jsPDF ??
            (jsPDFModule as JsPDFModule & { default?: JsPDFConstructor })
              .default ??
            jsPDFModule;

          // Parse markdown to tokens
          const tokens = markedLib.lexer
            ? markedLib.lexer(content || "")
            : [{ type: "paragraph", text: content }];

          const doc = new (JsPDFConstructor as JsPDFConstructor)({
            unit: "pt",
            format: "a4",
          });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 40;
          const maxWidth = pageWidth - margin * 2;
          let cursorY = margin;

          const addText = (
            text: string,
            fontSize = 12,
            font = "helvetica",
            style: "normal" | "bold" | "italic" = "normal",
          ) => {
            doc.setFont(
              font,
              style === "bold"
                ? "bold"
                : style === "italic"
                  ? "italic"
                  : "normal",
            );
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxWidth);
            for (const line of lines) {
              if (cursorY + fontSize * 1.2 > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
              }
              doc.text(line, margin, cursorY);
              cursorY += fontSize * 1.2;
            }
            cursorY += fontSize * 0.25;
          };

          for (const t of tokens) {
            if (t.type === "heading") {
              const level = Math.min(Math.max(t.depth ?? 1, 1), 6);
              const size =
                level === 1 ? 20 : level === 2 ? 18 : level === 3 ? 16 : 14;
              addText(String(t.text), size, "helvetica", "bold");
            } else if (t.type === "paragraph") {
              addText(String(t.text), 12);
            } else if (t.type === "list") {
              if (t.items) {
                for (const item of t.items) {
                  addText(`• ${String(item.text)}`, 12);
                }
              }
            } else if (t.type === "code") {
              addText(String(t.text), 10, "courier");
            } else if (t.type === "blockquote") {
              addText(String(t.text), 12, "helvetica", "italic");
            } else {
              if (typeof t.text === "string") addText(String(t.text), 12);
            }
          }

          const pdfBlob = doc.output("blob");
          downloadBlob(pdfBlob, `${baseName}.pdf`);
          return;
        } catch (e) {
          console.error("PDF export failed", e);
          toast.error("PDF export failed. Please try again.");
          return;
        }
      }

      if (exportFormat === "docx") {
        try {
          const [{ marked }, docxModule] = await Promise.all([
            import("marked"),
            import("docx"),
          ]);
          const { Document, Packer, Paragraph, TextRun, HeadingLevel } =
            docxModule;

          const markedLib = marked as unknown as MarkedLib;
          const tokens = markedLib.lexer(content || "");
          const children: InstanceType<typeof Paragraph>[] = [];

          for (const t of tokens) {
            if (t.type === "heading") {
              const level = Math.min(Math.max(t.depth ?? 1, 1), 6);
              let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] =
                HeadingLevel.HEADING_1;
              if (level === 1) heading = HeadingLevel.HEADING_1;
              else if (level === 2) heading = HeadingLevel.HEADING_2;
              else if (level === 3) heading = HeadingLevel.HEADING_3;
              else heading = HeadingLevel.HEADING_3;
              children.push(new Paragraph({ text: t.text ?? "", heading }));
            } else if (t.type === "paragraph") {
              children.push(
                new Paragraph({
                  children: [new TextRun(t.text ?? "")],
                }),
              );
            } else if (t.type === "list") {
              if (t.items) {
                for (const item of t.items) {
                  children.push(
                    new Paragraph({
                      children: [new TextRun(String(item.text))],
                      bullet: { level: 0 },
                    }),
                  );
                }
              }
            } else if (t.type === "code") {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: String(t.text), font: "Courier New" }),
                  ],
                }),
              );
            } else if (t.type === "blockquote") {
              children.push(
                new Paragraph({
                  children: [new TextRun(String(t.text))],
                }),
              );
            } else {
              // fallback: render raw text
              if (typeof t.text === "string")
                children.push(
                  new Paragraph({
                    children: [new TextRun(t.text)],
                  }),
                );
            }
          }

          const doc = new Document({
            sections: [{ properties: {}, children }],
          });
          const blob = await Packer.toBlob(doc);
          downloadBlob(blob, `${baseName}.docx`);
          return;
        } catch (e) {
          console.error("DOCX export failed", e);
          toast.error("DOCX export failed. Please try again.");
          return;
        }
      }
    })();
  }, [content, posts, exportFormat]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-2 border-gray-200/50 pb-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            📝 Edit your post
          </h2>
          <p className="text-gray-600">Start editing your blog post below...</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <SubmitButton></SubmitButton>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 mr-2">Format:</label>
            <select
              value={exportFormat}
              onChange={(e) =>
                setExportFormat(e.target.value as "markdown" | "pdf" | "docx")
              }
              className="px-3 py-2 rounded-md border"
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-40 bg-linear-to-r from-amber-500 to-amber-900 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transform transition duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <BgGradient className="opacity-20">
        <ForwardRefEditor
          markdown={posts[0].content}
          className="markdown-content border-dotted border-gray-200 border-2 p-4 rounded-md animate-in ease-in-out duration-75"
          onChange={handleContentChange}
        ></ForwardRefEditor>
      </BgGradient>
    </form>
  );
}
