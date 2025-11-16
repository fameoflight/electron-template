/** @type {import('tailwindcss').Config} */

import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */

const picassoPrimary = {
  DEFAULT: "#1677ff",
  50: "#e6f4ff",
  100: "#bae0ff",
  200: "#91caff",
  300: "#69b1ff",
  400: "#4096ff",
  500: "#1677ff",
  600: "#0958d9",
  700: "#003eb3",
  800: "#002c8c",
  900: "#001d66",
};

function typographyCss(theme, name) {
  const prefix = "colors." + name;

  return {
    "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
    "--tw-prose-invert-headings": theme("colors.white"),
    "--tw-prose-invert-links": theme("colors.white"),
    "--tw-prose-invert-bold": theme("colors.white"),
    "--tw-prose-invert-code": theme("colors.white"),
    "--tw-prose-body": theme(`${prefix}[900]`),
    "--tw-prose-headings": theme(`${prefix}[800]`),
    "--tw-prose-lead": theme(`${prefix}[600]`),
    "--tw-prose-links": theme(`${prefix}[700]`),
    "--tw-prose-bold": theme(`${prefix}[700]`),
    "--tw-prose-counters": theme(`${prefix}[500]`),
    "--tw-prose-bullets": theme(`${prefix}[400]`),
    "--tw-prose-hr": theme(`${prefix}[200]`),
    "--tw-prose-quotes": theme(`${prefix}[700]`),
    "--tw-prose-quote-borders": theme(`${prefix}[200]`),
    "--tw-prose-captions": theme(`${prefix}[600]`),
    "--tw-prose-code": theme(`${prefix}[700]`),
    "--tw-prose-pre-code": theme(`${prefix}[100]`),
    "--tw-prose-pre-bg": theme(`${prefix}[700]`),
    "--tw-prose-th-borders": theme(`${prefix}[200]`),
    "--tw-prose-td-borders": theme(`${prefix}[200]`),
    "--tw-prose-invert-body": theme(`${prefix}[200]`),
    "--tw-prose-invert-lead": theme(`${prefix}[200]`),
    "--tw-prose-invert-counters": theme(`${prefix}[400]`),
    "--tw-prose-invert-bullets": theme(`${prefix}[500]`),
    "--tw-prose-invert-hr": theme(`${prefix}[600]`),
    "--tw-prose-invert-quotes": theme(`${prefix}[100]`),
    "--tw-prose-invert-quote-borders": theme(`${prefix}[600]`),
    "--tw-prose-invert-captions": theme(`${prefix}[400]`),
    "--tw-prose-invert-pre-code": theme(`${prefix}[200]`),
    "--tw-prose-invert-th-borders": theme(`${prefix}[500]`),
    "--tw-prose-invert-td-borders": theme(`${prefix}[600]`),
  };
}

export default {
  content: ["./ui/**/*.{js,jsx,ts,tsx}", "./index.html"],
  corePlugins: {
    preflight: true,
  },
  important: false,
  theme: {
    listStyleType: {
      square: "square",
      disc: "disc",
      decimal: "decimal",
      roman: "upper-roman",
    },
    extend: {
      colors: {
        primary: picassoPrimary,
        "picasso-primary": picassoPrimary,
      },
      typography: ({ theme }) => ({
        "picasso-primary": {
          css: typographyCss(theme, "picasso-primary"),
        },
      }),
    },
  },
  plugins: [forms, typography],
};
