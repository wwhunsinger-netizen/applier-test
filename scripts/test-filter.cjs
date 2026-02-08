const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const CLIENT_ID = process.argv[2] || '23709e70-5086-43f3-a8f1-49ff4d51830e'; // default Jonathan
const JD_FILE = path.resolve(__dirname, '../../Job Descriptions for testing Dimas.txt');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseJDs(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parts = raw.split(/^(?:Full job description|Job [Dd]escription)\s*$/im);
  return parts.map(p => p.trim()).filter(p => p.length > 100);
}

async function loadClientContext() {
  const { data: client } = await supabase.from('clients')
    .select('*')
    .eq('id', CLIENT_ID)
    .single();

  if (!client) throw new Error('Client not found');

  const resumeText = client.resume_text || '';
  if (!resumeText) throw new Error('No resume_text for client');

  const criteria = {
    target_job_titles: (client.target_job_titles || []).join(', ') || '',
    required_skills: (client.required_skills || []).join(', ') || '',
    nice_to_have_skills: (client.nice_to_have_skills || []).join(', ') || '',
    years_of_experience: client.years_of_experience || '',
    seniority_level: Array.isArray(client.seniority_levels) ? client.seniority_levels.join(', ') : (client.seniority_levels || ''),
    exclude_keywords: (client.exclude_keywords || []).join(', ') || '',
    min_salary: client.min_salary || '',
  };

  console.log('Client:', client.first_name, client.last_name);
  console.log('Target titles:', criteria.target_job_titles);
  console.log('Required skills:', criteria.required_skills);
  console.log('Min salary:', criteria.min_salary ? `$${Number(criteria.min_salary).toLocaleString()}` : 'Not set');
  console.log('Resume length:', resumeText.length, 'chars');
  console.log('');

  return { resumeText, criteria };
}

function buildPrompt(criteria, resumeText, jobDescription) {
  return `You are a job screening filter for a reverse recruiting service. You review job descriptions against candidate profiles to identify OBVIOUS mismatches that would waste everyone's time.

Your job is to filter garbage, not make close calls. When in doubt, say CONTINUE. The next stage will do deeper analysis.

IMPORTANT: If the JD is in a non-English language, mentally translate it first, then evaluate.
IMPORTANT: Always provide a reason for your decision, even for CONTINUE.

<client_criteria>
Target Job Titles: ${criteria.target_job_titles || "Data Engineer"}
Preferred Skills: ${criteria.required_skills || ""}
Nice-to-Have Skills: ${criteria.nice_to_have_skills || ""}
Years of Experience: ${criteria.years_of_experience || "5+"}
Seniority Levels: ${criteria.seniority_level || "Mid to Senior"}
Exclude Keywords: ${criteria.exclude_keywords || ""}
Minimum Acceptable Salary: ${criteria.min_salary ? `$${Number(criteria.min_salary).toLocaleString()}` : "Not specified"}
Work Arrangement: Remote required (occasional/light travel is OK)

NOTE: "Preferred Skills" are tools the candidate WANTS to work with, not hard requirements. If the JD is in the same field and the candidate's resume shows they can do the work, do NOT skip just because the JD uses different tools in the same category (e.g. BigQuery instead of Snowflake, Airflow instead of DBT). Transferable skills within the same domain are fine.
</client_criteria>

<resume>
${resumeText}
</resume>

<hard_skip_criteria>
Return HARD_SKIP only when there is an OBVIOUS, OBJECTIVE mismatch.

1. EXCLUDE KEYWORD MATCH - If JD contains any exclude keywords -> HARD_SKIP
2. NOT REMOTE - On-site only or hybrid-required -> HARD_SKIP
3. COMPLETELY DIFFERENT PROFESSION
4. HARD REQUIREMENTS THEY CANNOT MEET (clearances, licenses, certifications)
5. EXPERIENCE MISMATCH — Only applies when the candidate has LESS experience than required, with a 7+ year UNDERQUALIFIED gap -> HARD_SKIP. Gaps under 7 years -> CONTINUE.
   OVERQUALIFIED IS ALMOST NEVER A SKIP: If the candidate has MORE experience than the JD requires, that is NOT a mismatch. A JD saying "2+ years" or "3+ years" is a MINIMUM requirement, not a ceiling. A candidate with 8 years applying to a "2+ years" role is perfectly fine — companies regularly hire above their listed minimums. Only skip overqualified if the title explicitly contains "Junior", "Entry Level", "Intern", or "New Grad".
   SENIORITY IN TITLE: A role titled "Data Engineer" (without "Senior") is NOT a skip for someone targeting "Senior Data Engineer". Companies often hire senior people into roles without "Senior" in the title. Only skip if the title explicitly indicates junior/entry-level.
6. FUNDAMENTALLY DIFFERENT JOB FUNCTION
   ADJACENT FUNCTIONS: Roles in a closely related function (e.g. Data Analyst for a Data Engineer) should CONTINUE, but ONLY if the role is at an appropriate seniority level, is remote, and the candidate's core skills clearly apply. If the function is adjacent but everything else lines up, it is worth applying. However if the adjacent role is a step DOWN in seniority or responsibility, HARD_SKIP.
7. SPECIALIST ROLE VS GENERALIST EXPERIENCE
8. DOMAIN/INDUSTRY EXPERIENCE - Do NOT skip just because the JD is in a different industry. If the core daily work matches what the candidate does (e.g. building data pipelines, cloud infrastructure), the industry is learnable. Only skip if the JD requires specific domain credentials or deep specialized knowledge that takes years to acquire (e.g. medical licenses, telecom certifications like TM Forum).

CRITICAL: DEFAULT TO CONTINUE. Only HARD_SKIP for OBVIOUS mismatches.
</hard_skip_criteria>

<decision_framework>
1. Exclude keywords? -> HARD_SKIP
2. Remote or remote-eligible? -> If on-site only, HARD_SKIP
3. Same FIELD? -> If different profession, HARD_SKIP
4. Unmeetable requirement? -> HARD_SKIP
5. UNDERQUALIFIED by 7+ years? -> HARD_SKIP. (Overqualified is NOT a skip — more experience than required is always fine unless title says Junior/Entry/Intern)
6. CORE work different? -> HARD_SKIP
7. Could hiring manager consider this? -> If clearly NO, HARD_SKIP

BEFORE returning HARD_SKIP, check the MANDATORY SALARY OVERRIDE:
If the JD lists a salary range AND the candidate has a Minimum Acceptable Salary -> compare the MAXIMUM of the posted range to the candidate's minimum. If max >= minimum -> you MUST return CONTINUE, not HARD_SKIP. No exceptions. The salary proves the role pays at the candidate's level regardless of title wording or listed experience requirements.
Example: JD range $79K-$132K, candidate minimum $115K -> max $132K >= $115K -> MUST CONTINUE.

If no HARD_SKIP triggers (or salary override applies) -> CONTINUE
</decision_framework>

<output_format>
Return ONLY valid JSON:
{
  "decision": "HARD_SKIP" or "CONTINUE",
  "match_strength": "strong" | "moderate" | "weak" | "none",
  "company": "extracted company name",
  "job_title": "extracted job title",
  "reason": "1-2 sentences explaining the decision",
  "skip_category": "exclude_keyword | not_remote | profession | clearance | license | certification | experience | seniority | function | specialist | domain | none"
}

MATCH STRENGTH (only for CONTINUE decisions):
- "strong": 80%+ match, target title, core skills align
- "moderate": 60-80% match, related title, most skills present
- "weak": 40-60% match, adjacent role, some transferable skills
- "none": Use for HARD_SKIP decisions
</output_format>

<job_description>
${jobDescription}
</job_description>`;
}

async function callFilter(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const resultText = data.content?.[0]?.text || '{}';

  // Parse JSON from response
  const jsonMatch =
    resultText.match(/```json\s*([\s\S]*?)\s*```/) ||
    resultText.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : resultText;
  return JSON.parse(jsonStr);
}

async function main() {
  console.log('='.repeat(80));
  console.log('FILTER TEST');
  console.log('='.repeat(80) + '\n');

  console.log('Loading client context...');
  const { resumeText, criteria } = await loadClientContext();

  console.log('Parsing job descriptions...');
  const jds = parseJDs(JD_FILE);
  console.log(`Found ${jds.length} job descriptions\n`);
  console.log('-'.repeat(80));

  const results = [];
  let continueCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const strengths = { strong: 0, moderate: 0, weak: 0, none: 0 };
  const skipCategories = {};
  const totalStart = Date.now();

  for (let i = 0; i < jds.length; i++) {
    const jd = jds[i];
    const preview = jd.substring(0, 70).replace(/\n/g, ' ');
    process.stdout.write(`[${i + 1}/${jds.length}] ${preview}... `);

    const start = Date.now();
    try {
      const prompt = buildPrompt(criteria, resumeText, jd);
      const result = await callFilter(prompt);
      const elapsed = Date.now() - start;

      results.push({ index: i + 1, ...result, elapsed });

      if (result.decision === 'CONTINUE') {
        continueCount++;
        strengths[result.match_strength] = (strengths[result.match_strength] || 0) + 1;
        console.log(`\x1b[32mAPPLY\x1b[0m [${result.match_strength}] (${(elapsed/1000).toFixed(1)}s) - ${result.job_title} @ ${result.company}`);
      } else {
        skipCount++;
        const cat = result.skip_category || 'unknown';
        skipCategories[cat] = (skipCategories[cat] || 0) + 1;
        console.log(`\x1b[31mSKIP\x1b[0m  [${cat}] (${(elapsed/1000).toFixed(1)}s) - ${result.job_title} @ ${result.company}`);
      }
    } catch (err) {
      const elapsed = Date.now() - start;
      errorCount++;
      results.push({ index: i + 1, error: err.message, elapsed });
      console.log(`\x1b[33mERROR\x1b[0m (${(elapsed/1000).toFixed(1)}s) - ${err.message}`);
    }
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total JDs:         ${jds.length}`);
  console.log(`Total time:        ${totalElapsed}s (avg ${(totalElapsed / jds.length).toFixed(1)}s per JD)`);
  console.log(`Apply (CONTINUE):  ${continueCount} (${((continueCount / jds.length) * 100).toFixed(1)}%)`);
  console.log(`Skip (HARD_SKIP):  ${skipCount} (${((skipCount / jds.length) * 100).toFixed(1)}%)`);
  console.log(`Errors:            ${errorCount}`);
  console.log('');
  console.log('Match Strengths (Apply decisions):');
  console.log(`  Strong:   ${strengths.strong}`);
  console.log(`  Moderate: ${strengths.moderate}`);
  console.log(`  Weak:     ${strengths.weak}`);
  console.log('');
  if (Object.keys(skipCategories).length > 0) {
    console.log('Skip Categories:');
    for (const [cat, count] of Object.entries(skipCategories).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  }

  // Detailed table
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(80));
  console.log(`${'#'.padStart(3)} | ${'Decision'.padEnd(5)} | ${'Strength'.padEnd(8)} | ${'Job Title'.padEnd(40)} | ${'Company'.padEnd(20)} | Reason`);
  console.log('-'.repeat(120));
  for (const r of results) {
    if (r.error) {
      console.log(`${String(r.index).padStart(3)} | ERROR | ${''.padEnd(8)} | ${''.padEnd(40)} | ${''.padEnd(20)} | ${r.error}`);
    } else {
      const decision = r.decision === 'CONTINUE' ? 'APPLY' : 'SKIP ';
      const strength = (r.match_strength || '').padEnd(8);
      const title = (r.job_title || 'Unknown').substring(0, 40).padEnd(40);
      const company = (r.company || 'Unknown').substring(0, 20).padEnd(20);
      console.log(`${String(r.index).padStart(3)} | ${decision} | ${strength} | ${title} | ${company} | ${r.reason}`);
    }
  }

  // Save to file
  const outputPath = path.resolve(__dirname, '../filter-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    client: CLIENT_ID,
    client_id: CLIENT_ID,
    tested_at: new Date().toISOString(),
    summary: { total: jds.length, apply: continueCount, skip: skipCount, errors: errorCount, strengths, skipCategories },
    results,
  }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
