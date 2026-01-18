
import { generateAIResponse } from '../lib/ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGrok() {
  console.log('Testing Grok API integration...');
  
  if (!process.env.GROK_API_KEY || process.env.GROK_API_KEY === 'your-grok-key-here') {
    console.error('Error: GROK_API_KEY is not set or is still the placeholder.');
    process.exit(1);
  }

  try {
    const response = await generateAIResponse({
      provider: 'grok',
      prompt: 'Say "Hello, Adventurer!" and give me a random D&D class name.',
      maxTokens: 50,
    });

    console.log('\n--- Grok Response ---');
    console.log(response);
    console.log('---------------------\n');
    console.log('✅ Grok API test passed successfully!');
  } catch (error) {
    console.error('\n❌ Grok API test failed:');
    const message = error instanceof Error ? error.message : String(error)
    console.error(message);
  }
}

testGrok();
