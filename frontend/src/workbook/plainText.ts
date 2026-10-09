/**
 * Workbook fields are plain text, but models often answer in Markdown despite being asked
 * not to. Removes the common markup (bold, italics, headings) and keeps simple "-" lists.
 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^(\s*)[*+]\s+/gm, '$1- ')
    .replace(/[ \t]+$/gm, '')
}
