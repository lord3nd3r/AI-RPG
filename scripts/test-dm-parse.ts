import { DMUpdateSchema } from '../lib/validators/dm'

function extractJson(text: string): string | null {
  const codeBlock = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (codeBlock) return codeBlock[1]

  const firstBrace = text.indexOf('{')
  if (firstBrace === -1) return null
  let depth = 0
  for (let i = firstBrace; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(firstBrace, i + 1)
    }
  }
  return null
}

const cases = [
  {
    name: 'code block JSON',
    input: 'The story unfolds.\n```json\n{"updates":[{"characterName":"Sorian","hpChange":-5}]}\n```',
    expectValid: true,
  },
  {
    name: 'inline JSON object',
    input: 'Scene. { "updates": [ { "characterName": "Sorian", "hpChange": -3 } ] }',
    expectValid: true,
  },
  {
    name: 'invalid JSON',
    input: 'Bad output { updates: [ { name: } ] }',
    expectValid: false,
  },
]

let failed = 0
for (const c of cases) {
  const jsonString = extractJson(c.input)
  if (!jsonString) {
    if (c.expectValid) {
      console.error(`FAIL: ${c.name} - no JSON extracted but expected valid`)
      failed++
    } else {
      console.log(`PASS: ${c.name} - correctly no JSON extracted`)
    }
    continue
  }

  try {
    const parsed = JSON.parse(jsonString)
    const result = DMUpdateSchema.safeParse(parsed)
    if (result.success && c.expectValid) console.log(`PASS: ${c.name}`)
    else if (!result.success && !c.expectValid) console.log(`PASS: ${c.name} - invalid as expected`)
    else {
      console.error(`FAIL: ${c.name} - validation mismatch`, result)
      failed++
    }
  } catch (e) {
    if (c.expectValid) {
      console.error(`FAIL: ${c.name} - JSON parse failed`)
      failed++
    } else {
      console.log(`PASS: ${c.name} - parse failed as expected`)
    }
  }
}

if (failed > 0) {
  console.error(`${failed} tests failed`)
  process.exit(1)
} else {
  console.log('All DM parser tests passed')
}
