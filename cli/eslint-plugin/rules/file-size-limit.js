/**
 * File Size Limit Rule
 *
 * Enforces maximum file size in lines to prevent monolithic files.
 * Following the "small files hide complexity" principle.
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce maximum file size in lines (excluding empty and comment lines)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: undefined,
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "number",
            minimum: 1,
            default: 300,
          },
        },
      },
    ],
    messages: {
      tooManyLines:
        "File has {{count}} code lines, which exceeds the maximum of {{max}}.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const maxLines = options.max || 300;

    return {
      "Program:exit"() {
        const source = context.getSourceCode();
        const lines = source.getText().split("\n");
        let inBlockComment = false;
        let codeLineCount = 0;

        for (let line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (inBlockComment) {
            if (trimmed.includes("*/")) {
              inBlockComment = false;
            }
            continue;
          }
          if (trimmed.startsWith("//")) continue;
          if (trimmed.startsWith("/*")) {
            if (!trimmed.includes("*/")) {
              inBlockComment = true;
            }
            continue;
          }
          codeLineCount++;
        }

        if (codeLineCount > maxLines) {
          context.report({
            node: source.ast,
            messageId: "tooManyLines",
            data: { count: codeLineCount, max: maxLines },
          });
        }
      },
    };
  },
};
