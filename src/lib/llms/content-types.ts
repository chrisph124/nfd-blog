/**
 * Shared content shapes for the machine-readable markdown surface.
 *
 * A `CodeSample` is a single self-contained code unit (one code_tab, or one
 * richtext `code_block`). `ExtractedPostContent` is the single-source-of-truth
 * payload the Phase 3 JSON-LD builder consumes so it never re-walks a post body.
 */

export interface CodeSample {
  /** Filename or label; empty when the source has neither (e.g. a bare code block). */
  name: string;
  /** Allow-list-normalised language id (`''` for an unlabelled block). */
  language: string;
  /** Raw code, byte-for-byte with the rendered block. */
  code: string;
}

export interface ExtractedPostContent {
  /** Prose plaintext — entities stripped, code excluded (schema.org `articleBody`). */
  prose: string;
  /** Every code unit in the post, in authored order. */
  codeSamples: CodeSample[];
}
