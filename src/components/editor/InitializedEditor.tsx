'use client'

import type { ForwardedRef } from 'react'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  BoldItalicUnderlineToggles,
  ListsToggle,
  Separator,
  toolbarPlugin,
  UndoRedo,
  HighlightToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertAdmonition
} from '@mdxeditor/editor'

export default function InitializedMDXEditor({ markdown, editorRef, onChange }: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <div className="max-h-[1000px] overflow-y-auto custom-scrollbar">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={onChange}
        contentEditableClassName="prose dark:prose-invert max-w-none p-4 focus:outline-none bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="sticky top-0 z-10 flex items-center gap-2">
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <Separator />
                <HighlightToggle />
                <CreateLink />
                <Separator />
                <InsertImage />
                <InsertTable />
                <Separator />
                <InsertThematicBreak />
                <InsertAdmonition />
              </div>
            )
          })
        ]}
      />
    </div>
  )
}
