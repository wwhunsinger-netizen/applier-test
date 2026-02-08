// ── Typing Test Paragraphs ──────────────────────────────────────────

export const WARMUP_PARAGRAPH =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.";

export const TIMED_PARAGRAPH =
  "As a job application specialist, attention to detail is critical. Every resume must be tailored to match the job description, and every cover letter should highlight the candidate's most relevant experience. When filling out online applications, accuracy matters. A single typo in a phone number or email address can cost your client an interview. Speed is important too, but never at the expense of quality. The best appliers find the balance between working quickly and double-checking every field before hitting submit. Remember: you're representing real people with real career goals.";

// ── Scenario Questions ──────────────────────────────────────────────

export interface ScenarioQuestion {
  id: number;
  question: string;
  options: { value: string; label: string }[];
  correctAnswer: string;
}

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 1,
    question:
      "A job posting says \"hybrid - 3 days in office.\" Your client's intake form says they are remote-only. What do you do?",
    options: [
      { value: "a", label: "Apply anyway, the client can negotiate later" },
      { value: "b", label: "Skip it, it doesn't match the client's requirements" },
      { value: "c", label: "Flag it for the reviewer with a note about the mismatch" },
      { value: "d", label: "Change the client's preference to hybrid and apply" },
    ],
    correctAnswer: "c",
  },
  {
    id: 2,
    question:
      "The client's resume says 3 years of experience in project management, but their intake form says 2 years. Which do you use when filling out an application?",
    options: [
      { value: "a", label: "Use 3 years, the resume is more up to date" },
      { value: "b", label: "Use 2 years, the intake form is the source of truth" },
      { value: "c", label: "Use whichever number makes them more competitive" },
      { value: "d", label: "Flag the discrepancy for the reviewer before proceeding" },
    ],
    correctAnswer: "d",
  },
  {
    id: 3,
    question:
      'A job description requires an active Secret security clearance. Your client doesn\'t have one. What do you do?',
    options: [
      { value: "a", label: "Apply and note they're willing to obtain clearance" },
      { value: "b", label: "Skip the job, it's a hard requirement they can't meet" },
      { value: "c", label: "Apply without mentioning clearance and hope for the best" },
      { value: "d", label: "Flag it and ask if the client has a pending clearance" },
    ],
    correctAnswer: "b",
  },
  {
    id: 4,
    question:
      'The salary field on an application is optional. Your client told you "don\'t disclose salary expectations." What do you do?',
    options: [
      { value: "a", label: "Leave it blank" },
      { value: "b", label: 'Enter "Open to negotiation"' },
      { value: "c", label: "Put the range from the job posting" },
      { value: "d", label: "Enter the client's minimum from their intake form" },
    ],
    correctAnswer: "a",
  },
  {
    id: 5,
    question:
      "A job posting is for a Senior Python Developer. Your client's resume only lists JavaScript and TypeScript experience. Should you apply?",
    options: [
      { value: "a", label: "Yes, programming skills are transferable" },
      { value: "b", label: "No, it's a core skill mismatch" },
      { value: "c", label: "Yes, but note the client is willing to learn Python" },
      { value: "d", label: "Flag it for the reviewer to decide" },
    ],
    correctAnswer: "b",
  },
];

// ── Client Profile & Resume ─────────────────────────────────────────

export interface ClientProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  currentTitle: string;
  currentCompany: string;
  yearsExperience: number;
  desiredSalary: string;
  remotePreference: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  latino: string;
  veteranStatus: string;
  notes: string;
}

export const CLIENT_PROFILE: ClientProfile = {
  name: "Jordan Rivera",
  email: "jordan.rivera@gmail.com",
  phone: "(555) 234-8901",
  location: "Austin, TX",
  linkedin: "linkedin.com/in/jordanrivera",
  currentTitle: "Operations Coordinator",
  currentCompany: "Streamline Logistics",
  yearsExperience: 4,
  desiredSalary: "$72,000",
  remotePreference: "Remote only",
  summary:
    "Detail-oriented operations professional with 4 years of experience in logistics coordination, process improvement, and cross-functional team support. Proven track record of reducing operational costs by 15% and improving fulfillment accuracy. Looking to transition into an Operations Manager or Program Coordinator role.",
  skills: [
    "Project Coordination",
    "Process Improvement",
    "Data Analysis (Excel, Google Sheets)",
    "Vendor Management",
    "CRM Systems (Salesforce, HubSpot)",
    "Inventory Management",
    "Cross-functional Communication",
    "Scheduling & Calendar Management",
    "Budget Tracking",
    "Asana / Monday.com",
  ],
  experience: [
    {
      title: "Operations Coordinator",
      company: "Streamline Logistics",
      duration: "Jan 2022 - Present",
      bullets: [
        "Coordinate daily operations for a team of 12 warehouse associates across 2 distribution centers",
        "Reduced order fulfillment errors by 22% by implementing a new QA checklist process",
        "Manage vendor relationships with 15+ suppliers, negotiating contracts that saved $45K annually",
        "Built weekly KPI dashboards in Google Sheets to track team performance and identify bottlenecks",
        "Serve as primary point of contact between sales, warehouse, and customer success teams",
      ],
    },
    {
      title: "Administrative Assistant",
      company: "Bright Path Consulting",
      duration: "Jun 2020 - Dec 2021",
      bullets: [
        "Supported a team of 8 consultants with scheduling, travel coordination, and expense reporting",
        "Maintained client database in Salesforce with 99% data accuracy",
        "Created and standardized 20+ document templates, reducing report preparation time by 30%",
        "Coordinated logistics for quarterly client events with 50-100 attendees",
      ],
    },
  ],
  education: [
    {
      degree: "B.A. in Business Administration",
      school: "University of Texas at Austin",
      year: "2020",
    },
  ],
  latino: "No",
  veteranStatus: "No",
  notes:
    "Client prefers remote roles only. Target salary is $72K. Open to Operations Manager, Program Coordinator, or similar titles. Not interested in sales-heavy roles.",
};

// ── Job Descriptions ────────────────────────────────────────────────

export interface JobDescription {
  id: number;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  type: string;
  description: string;
  requirements: string[];
  niceToHave?: string[];
  hasEEO?: boolean;
  hasTrapFields?: boolean;
  mismatchNotes?: string;
  isReview?: boolean;
}

// ── Pre-filled Review Applications (with intentional errors) ────────

export interface ReviewField {
  key: string;
  label: string;
  value: string;
  hasError: boolean;
  errorExplanation?: string;
}

export interface ReviewApplication {
  jobId: number;
  fields: ReviewField[];
}

export const REVIEW_APPLICATIONS: ReviewApplication[] = [
  {
    // Review 1: Easy - 2 errors (wrong email, wrong phone)
    jobId: 1,
    fields: [
      { key: "fullName", label: "Full Name", value: "Jordan Rivera", hasError: false },
      { key: "email", label: "Email Address", value: "jordan.rivers@email.com", hasError: true, errorExplanation: "Wrong email - should be jordan.rivera@gmail.com (rivers vs rivera, email.com vs gmail.com)" },
      { key: "phone", label: "Phone Number", value: "(555) 234-8910", hasError: true, errorExplanation: "Wrong phone number - should be (555) 234-8901 (digits transposed)" },
      { key: "location", label: "Location", value: "Austin, TX", hasError: false },
      { key: "linkedin", label: "LinkedIn URL", value: "linkedin.com/in/jordanrivera", hasError: false },
      { key: "yearsExp", label: "Years of Experience", value: "4", hasError: false },
      { key: "desiredSalary", label: "Desired Salary", value: "$72,000", hasError: false },
      { key: "whyRole", label: "Why are you interested in this role?", value: "I have 4 years of operations experience with a strong background in vendor management and process improvement. I'm excited about TechFlow's fully remote setup and the chance to work cross-functionally with engineering and sales teams.", hasError: false },
    ],
  },
  {
    // Review 2: Medium - 3 errors (location mismatch not flagged, salary disclosed, wrong years)
    jobId: 2,
    fields: [
      { key: "fullName", label: "Full Name", value: "Jordan Rivera", hasError: false },
      { key: "email", label: "Email Address", value: "jordan.rivera@gmail.com", hasError: false },
      { key: "phone", label: "Phone Number", value: "(555) 234-8901", hasError: false },
      { key: "location", label: "Location", value: "Dallas, TX", hasError: true, errorExplanation: "Client is in Austin, TX - not Dallas. The job is hybrid in Dallas but the client's location should still be listed as Austin, TX." },
      { key: "linkedin", label: "LinkedIn URL", value: "linkedin.com/in/jordanrivera", hasError: false },
      { key: "yearsExp", label: "Years of Experience", value: "5", hasError: true, errorExplanation: "Client has 4 years of experience, not 5. Experience was inflated." },
      { key: "desiredSalary", label: "Desired Salary", value: "$60,000", hasError: true, errorExplanation: "Client's target salary is $72K. This is below their target." },
      { key: "whyRole", label: "Why are you interested in this role?", value: "With my background in project coordination and client services, I'd be a strong fit for this Program Coordinator role. I'm experienced with project management tools and comfortable managing multiple timelines.", hasError: false },
    ],
  },
  {
    // Review 3: Hard - 4 errors (EEO wrong, BI tools fabricated, experience inflated, wrong company)
    jobId: 3,
    fields: [
      { key: "fullName", label: "Full Name", value: "Jordan Rivera", hasError: false },
      { key: "email", label: "Email Address", value: "jordan.rivera@gmail.com", hasError: false },
      { key: "phone", label: "Phone Number", value: "(555) 234-8901", hasError: false },
      { key: "location", label: "Location", value: "Austin, TX", hasError: false },
      { key: "linkedin", label: "LinkedIn URL", value: "linkedin.com/in/jordanrivera", hasError: false },
      { key: "currentCompany", label: "Current Company", value: "Streamline Solutions", hasError: true, errorExplanation: "Wrong company name - should be Streamline Logistics, not Streamline Solutions." },
      { key: "yearsExp", label: "Years of Experience", value: "5+", hasError: true, errorExplanation: "Client has 4 years of experience. This was inflated to match the job requirement of 5+ years." },
      { key: "biTools", label: "BI Tools Proficiency", value: "Tableau, Power BI", hasError: true, errorExplanation: "Client has no BI tools experience listed on their resume. These skills were fabricated." },
      { key: "latino", label: "Latino", value: "Yes", hasError: true, errorExplanation: "Client's profile says Latino: No." },
      { key: "veteranStatus", label: "Protected Veteran", value: "No", hasError: false },
      { key: "whyRole", label: "Why are you interested in this role?", value: "I bring strong analytical skills and operations experience. I've built KPI dashboards and managed cross-functional teams, and I'm ready to take on a senior-level role focused on data-driven process optimization.", hasError: false },
    ],
  },
];

export const JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: 1,
    title: "Operations Manager",
    company: "TechFlow Solutions",
    location: "Remote",
    salaryRange: "$65,000 - $80,000",
    type: "Full-time",
    description:
      "TechFlow Solutions is looking for an Operations Manager to oversee daily business operations, manage vendor relationships, and drive process improvements. You'll work closely with engineering, sales, and customer success to ensure smooth cross-functional workflows. This is a fully remote role reporting to the VP of Operations.",
    requirements: [
      "3+ years in operations, logistics, or project coordination",
      "Experience with CRM tools (Salesforce, HubSpot)",
      "Strong Excel / Google Sheets skills",
      "Excellent written and verbal communication",
      "Experience managing vendor relationships",
    ],
    niceToHave: [
      "Experience with Asana or Monday.com",
      "Background in a tech or SaaS environment",
      "PMP or similar certification",
    ],
  },
  {
    id: 2,
    title: "Program Coordinator",
    company: "Nexus Group",
    location: "Hybrid - Dallas, TX (2 days/week in office)",
    salaryRange: "$58,000 - $72,000",
    type: "Full-time",
    description:
      "Nexus Group is seeking a Program Coordinator to support our growing Client Services division. You'll coordinate project timelines, manage internal communications, and ensure deliverables stay on track. This role is hybrid, with 2 days per week in our Dallas office.",
    requirements: [
      "2+ years of experience in program or project coordination",
      "Proficiency in Microsoft Office and Google Workspace",
      "Strong organizational and multitasking skills",
      "Experience with project management tools",
      "Ability to work independently and in a team environment",
    ],
    niceToHave: [
      "Bachelor's degree in Business Administration or related field",
      "Experience in consulting or professional services",
    ],
    mismatchNotes:
      "This role is hybrid in Dallas, TX. The client is remote-only and based in Austin. There's a location/work-style mismatch that should be flagged.",
  },
  {
    id: 3,
    title: "Senior Operations Analyst",
    company: "Apex Industries",
    location: "Remote",
    salaryRange: "$70,000 - $90,000",
    type: "Full-time",
    description:
      "Apex Industries is hiring a Senior Operations Analyst to join our Strategy & Ops team. This role involves deep data analysis, process optimization, and reporting to executive leadership. You'll own key operational metrics and lead initiatives to improve efficiency across the organization.",
    requirements: [
      "5+ years of operations or data analysis experience",
      "Advanced Excel skills (pivot tables, VLOOKUP, macros)",
      "Experience with BI tools (Tableau, Power BI, or Looker)",
      "Strong analytical and problem-solving abilities",
      "Excellent presentation skills for executive reporting",
    ],
    niceToHave: [
      "SQL proficiency",
      "Experience in manufacturing or supply chain",
      "Six Sigma or Lean certification",
    ],
    hasEEO: true,
    hasTrapFields: true,
    mismatchNotes:
      "This role requires 5+ years experience. The client has 4 years. It also asks for BI tools (Tableau, Power BI, Looker) which aren't on the client's resume. The experience gap and missing BI skills should be noted.",
  },
  {
    id: 4,
    title: "Operations Lead",
    company: "BrightWave Inc.",
    location: "Remote",
    salaryRange: "$68,000 - $85,000",
    type: "Full-time",
    description:
      "BrightWave Inc. is looking for an Operations Lead to manage day-to-day operations, optimize internal workflows, and coordinate across departments. You'll report directly to the COO and play a key role in scaling our processes as the company grows. This is a fully remote position.",
    requirements: [
      "3+ years in operations, project management, or a related field",
      "Experience with CRM platforms (Salesforce, HubSpot, or similar)",
      "Strong proficiency in Excel or Google Sheets",
      "Excellent organizational and communication skills",
      "Comfortable working independently in a remote environment",
    ],
    niceToHave: [
      "Experience with project management tools (Asana, Monday.com, Trello)",
      "Background in a startup or fast-paced environment",
      "Budget management experience",
    ],
    hasEEO: true,
  },
];

// ── EEO Options ─────────────────────────────────────────────────────

export const EEO_GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to disclose",
];

export const EEO_LATINO_OPTIONS = [
  "Yes",
  "No",
  "Prefer not to disclose",
];

export const EEO_VETERAN_OPTIONS = [
  "I am a veteran",
  "I am not a veteran",
  "Prefer not to disclose",
];

export const EEO_DISABILITY_OPTIONS = [
  "Yes, I have a disability",
  "No, I don't have a disability",
  "Prefer not to disclose",
];
