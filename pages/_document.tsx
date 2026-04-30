// Pages Router _document — required only because Next.js still generates
// legacy /404 and /500 pages even in App-Router-only projects, and they use
// <Html> from next/document. The App Router is unaffected and continues to
// use src/app/layout.tsx as its root.
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
