"use client"

import ReactMarkdown from "react-markdown"
import { HttpTypes } from "@medusajs/types"

interface ProductDescriptionSectionProps {
  product: HttpTypes.StoreProduct
}

export default function ProductDescriptionSection({
  product,
}: ProductDescriptionSectionProps) {
  if (!product.description) {
    return null
  }

  return (
    <div className="w-full border-t border-slate-200 pt-6 mt-6">
      <h3 className="text-lg small:text-xl font-bold text-slate-900 mb-4">
        Product Description
      </h3>
      
      <div className="prose prose-sm max-w-none text-slate-700">
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold text-slate-900 mt-4 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-bold text-slate-900 mt-3 mb-2">
                {children}
              </h3>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className="mb-3 leading-relaxed text-slate-700">
                {children}
              </p>
            ),
            // Links
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-slate-700">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-700">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="ml-2">{children}</li>
            ),
            // Code blocks
            code: ({ inline, children }) => {
              if (inline) {
                return (
                  <code className="bg-slate-100 text-slate-900 px-2 py-1 rounded font-mono text-sm">
                    {children}
                  </code>
                )
              }
              return (
                <code className="block bg-slate-100 text-slate-900 p-3 rounded font-mono text-sm overflow-x-auto my-3 border border-slate-200">
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-slate-100 p-3 rounded overflow-x-auto my-3 border border-slate-200">
                {children}
              </pre>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-3">
                {children}
              </blockquote>
            ),
            // Horizontal rule
            hr: () => <hr className="my-4 border-slate-200" />,
            // Tables
            table: ({ children }) => (
              <table className="w-full border-collapse border border-slate-200 my-3">
                {children}
              </table>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-100">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="border border-slate-200">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-900">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-slate-200 px-3 py-2 text-slate-700">
                {children}
              </td>
            ),
          }}
        >
          {product.description}
        </ReactMarkdown>
      </div>
    </div>
  )
}
