const OpenAI = require('openai');
require('dotenv').config();

async function testImprovedPrompt() {
  console.log('🧪 Testing Improved Scholarship-Focused Prompt\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found. Please check your .env file');
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const testQueries = [
    "indonesia",
    "computer science", 
    "women in stem",
    "phd research"
  ];
  
  for (const query of testQueries) {
    console.log(`📝 Testing Query: "${query}"`);
    console.log('─'.repeat(60));
    
    try {
      // Use the improved system and user prompts
      const system = 'You are a scholarship search specialist. Generate ONLY scholarship-related search queries. Output JSON only: {"prompts": string[]}. Focus on: scholarships, grants, funding, financial aid, academic opportunities, university programs, degree funding, research grants, student financial support. Avoid general topics - every query must be scholarship/funding related.';
      
      const user = `Query: ${query}\nLocale: en\nCount: 5\n\nIMPORTANT: Transform this query into 5 scholarship-specific search queries. If the original query is not scholarship-related, add scholarship/funding context. Examples:\n- "indonesia" → "Indonesia scholarships for international students", "Indonesian government scholarships", "University scholarships in Indonesia"\n- "computer science" → "Computer science scholarships", "CS degree funding opportunities", "Tech scholarships for students"\n\nEvery generated query must include scholarship, funding, grant, or financial aid terms.`;
      
      console.log('🤖 Sending to OpenAI with improved prompt...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content || '{"prompts":[]}';
      console.log('\n✅ OpenAI Response:');
      console.log(response);
      
      // Parse and validate
      let prompts = [];
      try {
        const parsed = JSON.parse(response);
        prompts = parsed.prompts || [];
        
        console.log('\n🔍 Generated Prompts:');
        prompts.forEach((prompt, index) => {
          // Check if it's scholarship-related
          const scholarshipKeywords = ['scholarship', 'grant', 'funding', 'financial aid', 'tuition', 'degree', 'university', 'college', 'student', 'academic', 'research'];
          const lowerPrompt = prompt.toLowerCase();
          const isScholarshipRelated = scholarshipKeywords.some(keyword => lowerPrompt.includes(keyword));
          
          const status = isScholarshipRelated ? '✅' : '❌';
          console.log(`${status} ${index + 1}. ${prompt}`);
          
          if (!isScholarshipRelated) {
            console.log(`   ⚠️  This prompt is NOT scholarship-focused!`);
          }
        });
        
        // Count scholarship-related prompts
        const scholarshipCount = prompts.filter(p => {
          const lower = p.toLowerCase();
          return scholarshipKeywords.some(keyword => lower.includes(keyword));
        }).length;
        
        console.log(`\n📊 Scholarship-Focused Prompts: ${scholarshipCount}/${prompts.length}`);
        
        if (scholarshipCount === prompts.length) {
          console.log('🎉 All prompts are scholarship-focused!');
        } else {
          console.log('⚠️  Some prompts are not scholarship-focused');
        }
        
      } catch (parseError) {
        console.log('\n❌ Failed to parse response:', parseError.message);
      }
      
    } catch (error) {
      console.log('\n❌ Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Run the test
testImprovedPrompt().catch(console.error);
