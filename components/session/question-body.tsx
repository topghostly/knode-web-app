import { MarkdownAsync } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

/**
 * Server-rendered question Markdown. Fenced code is highlighted here with
 * shiki, so the browser gets coloured spans and no highlighter code.
 */
export async function QuestionBody({ markdown }: { markdown: string }) {
  return (
    <div className="question-body">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeShiki,
            {
              theme: "vitesse-light",
              lazy: true,
              fallbackLanguage: "text",
              defaultLanguage: "text",
              onError: () => {},
            },
          ],
        ]}
      >
        {markdown}
      </MarkdownAsync>
    </div>
  );
}
