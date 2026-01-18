import { NextResponse } from 'next/server'

export async function GET() {
  const providers = []

  const grokKey = process.env.GROK_API_KEY
  if (grokKey && grokKey !== 'your-grok-key-here') {
    providers.push({ id: 'grok', name: 'Grok' })
  }

  const openAiKey = process.env.OPENAI_API_KEY
  if (openAiKey && openAiKey !== 'your-openai-key-here') {
    providers.push({ id: 'chatgpt', name: 'ChatGPT' })
  }

  // We assume Ollama is valid if the base URL is set or default is used.
  // Since it doesn't require a key, we'll include it by default,
  // but users can disable it by intentionally setting OLLAMA_DISABLED=true if they want (optional feature)
  // For now, we just list it.
  providers.push({ id: 'ollama', name: 'Ollama (Local)' })

  return NextResponse.json(providers)
}
