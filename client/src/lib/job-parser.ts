interface ParsedJobDescription {
  summary: string;
  aboutCompany: string;
  responsibilities: string[];
  qualifications: string[];
  niceToHave: string[];
  skills: string[];
  benefits: string[];
  rawSections: { title: string; content: string }[];
}

const SECTION_PATTERNS = [
  { key: 'aboutCompany', patterns: [/about\s+(the\s+)?company/i, /about\s+us/i, /who\s+we\s+are/i, /company\s+overview/i] },
  { key: 'responsibilities', patterns: [/responsibilities/i, /what\s+you('ll|'ll|'ll| will)\s+do/i, /role\s+overview/i, /job\s+purpose/i, /in\s+this\s+role/i, /duties/i] },
  { key: 'qualifications', patterns: [/qualifications/i, /requirements/i, /what\s+we('re|'re|'re| are)\s+looking\s+for/i, /your\s+skills/i, /must\s+have/i, /skills\s+and\s+qualifications/i] },
  { key: 'niceToHave', patterns: [/nice\s+to\s+have/i, /preferred/i, /bonus/i, /plus/i, /good\s+to\s+have/i] },
  { key: 'benefits', patterns: [/benefits/i, /perks/i, /what\s+we\s+offer/i, /why\s+join/i, /compensation/i] },
];

const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'Git', 'Agile', 'Scrum', 'REST', 'API', 'GraphQL', 'MongoDB', 'PostgreSQL',
  'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD', 'Salesforce', 'SAP', 'Oracle',
  'Apex', 'Visualforce', 'Lightning', 'LWC', 'SOQL', 'Integration', 'Architecture', 'Leadership',
  'Communication', 'Project Management', 'Excel', 'Tableau', 'Power BI', 'Figma', 'Adobe',
  'HTML', 'CSS', 'Vue', 'Angular', 'Next.js', 'Ruby', 'Go', 'Rust', 'C++', 'C#', '.NET',
  'Spring', 'Django', 'Flask', 'Express', 'Redux', 'TailwindCSS', 'Bootstrap', 'SASS',
  'Jira', 'Confluence', 'Slack', 'Teams', 'Zoom', 'Notion', 'Asana', 'Trello',
  'B2B', 'B2C', 'E-commerce', 'SaaS', 'CRM', 'ERP', 'BI', 'ETL', 'Data Pipeline',
  'Microservices', 'Serverless', 'Lambda', 'S3', 'EC2', 'RDS', 'CloudFormation',
  'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
  'Linux', 'Unix', 'Windows Server', 'Networking', 'Security', 'OAuth', 'JWT',
  'Agile', 'Waterfall', 'Lean', 'Six Sigma', 'PMP', 'Certified', 'Bachelor', 'Master', 'PhD'
];

function extractSkills(text: string): string[] {
  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const skill of SKILL_KEYWORDS) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      foundSkills.push(skill);
    }
  }
  
  // Also extract years of experience patterns
  const expMatch = text.match(/(\d+)\+?\s*years?\s*(of\s+)?experience/gi);
  if (expMatch) {
    foundSkills.push(expMatch[0].replace(/\s+/g, ' ').trim());
  }
  
  return Array.from(new Set(foundSkills)).slice(0, 15); // Limit to 15 skills
}

function extractBulletPoints(text: string): string[] {
  const bullets: string[] = [];
  
  // Match common bullet patterns
  const bulletPatterns = [
    /[•·●○◦▪▸►]\s*([^\n•·●○◦▪▸►]+)/g,
    /[-–—]\s+([^\n-]+)/g,
    /\d+\.\s+([^\n]+)/g,
    /\*\s+([^\n]+)/g,
  ];
  
  for (const pattern of bulletPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const point = match[1]?.trim();
      if (point && point.length > 10 && point.length < 500) {
        bullets.push(point);
      }
    }
  }
  
  // Also try splitting by colons for lists like "Responsibility: Do something. Another: Do this."
  const colonSplit = text.split(/\.\s+(?=[A-Z][^.]+:)/);
  for (const part of colonSplit) {
    const colonMatch = part.match(/^([A-Z][^:]+):\s*(.+)/);
    if (colonMatch && colonMatch[2]?.length > 10) {
      bullets.push(`${colonMatch[1]}: ${colonMatch[2].trim()}`);
    }
  }
  
  return Array.from(new Set(bullets)).slice(0, 10);
}

function findSectionStart(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.search(pattern);
    if (match !== -1) return match;
  }
  return -1;
}

export function parseJobDescription(description: string): ParsedJobDescription {
  if (!description) {
    return {
      summary: '',
      aboutCompany: '',
      responsibilities: [],
      qualifications: [],
      niceToHave: [],
      skills: [],
      benefits: [],
      rawSections: [],
    };
  }

  const result: ParsedJobDescription = {
    summary: '',
    aboutCompany: '',
    responsibilities: [],
    qualifications: [],
    niceToHave: [],
    skills: [],
    benefits: [],
    rawSections: [],
  };

  // Extract skills from the entire description
  result.skills = extractSkills(description);

  // Try to find section boundaries
  const sectionStarts: { key: string; start: number; patterns: RegExp[] }[] = [];
  
  for (const { key, patterns } of SECTION_PATTERNS) {
    const start = findSectionStart(description, patterns);
    if (start !== -1) {
      sectionStarts.push({ key, start, patterns });
    }
  }

  // Sort by position
  sectionStarts.sort((a, b) => a.start - b.start);

  // Extract content for each section
  for (let i = 0; i < sectionStarts.length; i++) {
    const current = sectionStarts[i];
    const nextStart = sectionStarts[i + 1]?.start ?? description.length;
    const sectionText = description.slice(current.start, nextStart);
    
    // Remove the header from the section content
    const headerMatch = sectionText.match(current.patterns[0]);
    const content = headerMatch 
      ? sectionText.slice(headerMatch[0].length).trim()
      : sectionText.trim();

    switch (current.key) {
      case 'aboutCompany':
        result.aboutCompany = content.slice(0, 300) + (content.length > 300 ? '...' : '');
        break;
      case 'responsibilities':
        result.responsibilities = extractBulletPoints(content);
        if (result.responsibilities.length === 0) {
          // Fall back to sentence splitting
          result.responsibilities = content
            .split(/\.\s+/)
            .filter(s => s.length > 20 && s.length < 200)
            .slice(0, 6)
            .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
        }
        break;
      case 'qualifications':
        result.qualifications = extractBulletPoints(content);
        if (result.qualifications.length === 0) {
          result.qualifications = content
            .split(/\.\s+/)
            .filter(s => s.length > 20 && s.length < 200)
            .slice(0, 6)
            .map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
        }
        break;
      case 'niceToHave':
        result.niceToHave = extractBulletPoints(content);
        break;
      case 'benefits':
        result.benefits = extractBulletPoints(content);
        break;
    }
  }

  // Extract summary from the beginning of the description (before first section)
  const firstSectionStart = sectionStarts[0]?.start ?? description.length;
  const introText = description.slice(0, Math.min(firstSectionStart, 500));
  
  // Get first few sentences as summary
  const sentences = introText.split(/\.\s+/);
  result.summary = sentences.slice(0, 2).join('. ').trim();
  if (result.summary && !result.summary.endsWith('.')) {
    result.summary += '.';
  }

  // If we didn't find structured sections, try to extract from the raw text
  if (result.responsibilities.length === 0 && result.qualifications.length === 0) {
    const allBullets = extractBulletPoints(description);
    // Split bullets roughly in half - first half responsibilities, second half qualifications
    const midpoint = Math.ceil(allBullets.length / 2);
    result.responsibilities = allBullets.slice(0, midpoint);
    result.qualifications = allBullets.slice(midpoint);
  }

  return result;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
