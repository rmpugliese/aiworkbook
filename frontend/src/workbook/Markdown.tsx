import { Typography } from '@mantine/core'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { withLineBreaks } from './markdownEditing'

const components: Components = {
  // Wide tables scroll inside the field instead of stretching the page.
  table: ({ node: _node, ...props }) => (
    <div style={{ overflowX: 'auto' }}>
      <table {...props} />
    </div>
  ),
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
}

/**
 * Answers rendered from Markdown. HTML in the text is never interpreted, and react-markdown drops
 * javascript: and similar links.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <Typography className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {withLineBreaks(text)}
      </ReactMarkdown>
    </Typography>
  )
}
