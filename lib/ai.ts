
export type AIProvider = 'grok' | 'chatgpt' | 'ollama';

interface AIRequest {
  provider: AIProvider;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse({
  provider,
  prompt,
  systemPrompt = 'You are a Dungeon Master for a fantasy RPG.',
  maxTokens = 1000,
}: AIRequest): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  switch (provider) {
    case 'grok':
      return callGrok(messages, maxTokens);
    case 'chatgpt':
      return callOpenAI(messages, maxTokens);
    case 'ollama':
      return callOllama(messages, maxTokens);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export async function generateAIResponseWithRetries(
  opts: AIRequest,
  retries = 3,
  backoffMs = 500
): Promise<string> {
  let attempt = 0
  while (true) {
    try {
      return await generateAIResponse(opts)
    } catch (err) {
      attempt++
      if (attempt >= retries) throw err
      await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt - 1)))
    }
  }
}

async function callGrok(messages: Message[], maxTokens: number): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey || apiKey === 'your-grok-key-here') {
    throw new Error('GROK_API_KEY is not configured');
  }

  // Grok API endpoint
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-4-fast-reasoning', // Updated to latest model
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callOpenAI(messages: Message[], maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-key-here') {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Default to a recent model
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callOllama(messages: Message[], maxTokens: number): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  // Ollama chat endpoint
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3', // Default to llama3, user might need to pull it
      messages,
      stream: false,
      options: {
        num_predict: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}
