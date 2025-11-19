"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Heading1, Heading2, List, Link as LinkIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TipTapEditor({ content, onChange, placeholder = "Start writing..." }: TipTapEditorProps) {
  const [isMounted] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  })

  // Update editor content when content prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  if (!isMounted || !editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8"
        >
          <Bold className="h-4 w-4 mr-1" />
          Bold
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8"
        >
          <Italic className="h-4 w-4 mr-1" />
          Italic
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8"
        >
          <Heading1 className="h-4 w-4 mr-1" />
          H1
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8"
        >
          <Heading2 className="h-4 w-4 mr-1" />
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8"
        >
          <List className="h-4 w-4 mr-1" />
          List
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8"
        >
          <List className="h-4 w-4 mr-1" />
          Ordered
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            const url = window.prompt("Enter URL:")
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className="h-8"
        >
          <LinkIcon className="h-4 w-4 mr-1" />
          Link
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
