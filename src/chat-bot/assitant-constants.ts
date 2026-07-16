// src/constants.ts

// ====== DETAILED_FEATURE_DESCRIPTIONS (Your app's knowledge base with aliases) ======
export const DETAILED_FEATURE_DESCRIPTIONS: { [key: string]: string } = {
  breaks:
    "The Breaks section allows you to log and track various types of breaks, such as lunch, coffee, short breaks, or focus time. By consistently logging your breaks, you can gain insights into your productivity patterns and ensure you're taking enough time to recharge and reduce fatigue. It helps you maintain a healthy work-life balance.",
  break:
    "The Breaks section allows you to log and track various types of breaks, such as lunch, coffee, short breaks, or focus time. By consistently logging your breaks, you can gain insights into your productivity patterns and ensure you're taking enough time to recharge and reduce fatigue. It helps you maintain a healthy work-life balance.",
  breake:
    "The Breaks section allows you to log and track various types of breaks, such as lunch, coffee, short breaks, or focus time. By consistently logging your breaks, you can gain insights into your productivity patterns and ensure you're taking enough time to recharge and reduce fatigue. It helps you maintain a healthy work-life balance.",
  brake:
    "The Breaks section allows you to log and track various types of breaks, as if you were logging a break. By consistently logging your breaks, you can gain insights into your productivity patterns and ensure you're taking enough time to recharge and reduce fatigue. It helps you maintain a healthy work-life balance.",
  brke: "The Breaks section allows you to log and track various types of breaks, as if you were logging a break. By consistently logging your breaks, you can gain insights into your productivity patterns and ensure you're taking enough time to recharge and reduce fatigue. It helps you maintain a healthy work-life balance.",

  tasks:
    "In the Tasks section, you can efficiently manage your workload. You can create new tasks, set their priorities (low, medium, high), add detailed descriptions, define deadlines, and track their status (pending, in progress, completed). This helps you stay organized and boost your overall productivity.",
  taks: "In the Tasks section, you can efficiently manage your workload. You can create new tasks, set their priorities (low, medium, high), add detailed descriptions, define deadlines, and track their status (pending, in progress, completed). This helps you stay organized and boost your overall productivity.",
  task: "In the Tasks section, you can efficiently manage your workload. You can create new tasks, set their priorities (low, medium, high), add detailed descriptions, define deadlines, and track their status (pending, in progress, completed). This helps you stay organized and boost your overall productivity.",

  leaves:
    "The Leaves section is designed to help you plan and manage your time off effortlessly. You can apply for various types of leaves, track the reasons for your absence, and keep a clear record of your personal days or vacation time. It helps ensure your team is aware of your availability.",
  leave:
    "The Leaves section is designed to help you plan and manage your time off effortlessly. You can apply for various types of leaves, track the reasons for your absence, and keep a clear record of your personal days or vacation time. It helps ensure your team is aware of your availability.",
  leav: "The Leaves section is designed to help you plan and manage your time off effortlessly. You can apply for various types of leaves, track the reasons for your absence, and keep a clear record of your personal days or vacation time. It helps ensure your team is aware of your availability.",
  laev: "The Leaves section is designed to help you plan and manage your time off effortlessly. You can apply for various types of leaves, track the reasons for your absence, and keep a clear record of your personal days or vacation time. It helps ensure your team is aware of your availability.",

  meetings:
    "Meetings allow you to schedule specific time slots with a defined start and end time. You can add titles, descriptions, and participants to better manage collaboration. Meetings help ensure availability and planning across your team.",
  meeting:
    "Meetings allow you to schedule specific time slots with a defined start and end time. You can add titles, descriptions, and participants to better manage collaboration. Meetings help ensure availability and planning across your team.",
  meetng:
    "Meetings allow you to schedule specific time slots with a defined start and end time. You can add titles, descriptions, and participants to better manage collaboration. Meetings help ensure availability and planning across your team.",

  archives:
    "The Archives section serves as a historical record for your past activities within the Work Break app. Here, you can review past logs of breaks taken, completed tasks and approved leaves. It's a valuable resource for searching and reviewing your past activities and productivity trends.",
  "admin panel":
    "The Admin Panel provides team leads and administrators with powerful tools to monitor and manage team activities. From here, administrators can view and manage user breaks, tasks and leaves across the team. This centralized control helps in efficient team oversight and resource allocation.",
  "team status":
    "The Team Status features offer immediate visibility into your team's availability. This includes 'Who's On Break Now?' to see current breaks, and 'Today's Team Absences' to check who is on leave or off today. It helps optimize team collaboration and project planning.",
  settings:
    "In the Settings section, you can customize your Work Break experience. This includes managing your account details, updating preferences, and adjusting notifications to suit your workflow.",
  "about us":
    "The About Us section provides information about WorkBreak, our mission to help remote workers stay productive and prevent burnout, and the philosophy behind our application.",
  "contact us":
    "If you need support, have inquiries, or want to discuss business-related questions, the Contact Us section provides ways to get in touch with the WorkBreak team.",
  "privacy policy":
    "The Privacy Policy outlines how WorkBreak collects, uses, protects and handles your personal data. It details our commitment to protecting your information and respecting your privacy.",
  "delete account":
    "The Delete Account section provides information about the process and implications of permanently deleting your WorkBreak account, ensuring you understand the steps involved and data retention policies.",
  "sign in/sign up":
    "These sections facilitate your access to the WorkBreak app. Sign In allows existing users to log into their accounts, while Sign Up enables new users to create an account and begin their productivity journey with WorkBreak.",
};

// ====== ACTION_KEYWORDS (ONLY for creation now) ======
export const ACTION_KEYWORDS = [
  "create",
  "creat",
  "crate",
  "craete",
  "craet",
  "make",
  "made",
  "build",
  "submt",
  "sumit",
  "sum",
  "plan",
  "log",
  "start",
  "schedule",
  "schedul",
  "set up",
  "generate",
  "record",
  "organize",
  "begin",
  "establish",
  "write",
  "draft",
  "design",
  "compose",
  "initiate",
  "ad",
  "add",
  "insert",
  "insrt",
  "do",
  "have",
  "having",
  "need",
  "update"
];

// ====== INTENT_EXCLUSION_KEYWORDS (Prevents accidental creation for info questions) ======
export const INTENT_EXCLUSION_KEYWORDS = [
  "what is",
  "what’s",
  "whats",
  "who is",
  "who’s",
  "who's",
  "tell me",
  "definition",
  "how does",
  "how do",
  "why",
];

const todayDate = new Date().toISOString().split('T')[0];

export const SYSTEM_PROMPT = `
You are Break Buddy for Work Break.
You MUST ALWAYS return ONLY valid JSON.
Never return text, markdown, explanations, or commentary.
Never include "Summary".
Never include anything outside a single JSON object.

Your job is to detect the user's intent and return exactly one of these supported actions:
- createBreak
- createLeave
- createTask
- createMeeting

If the request is unclear, choose the closest valid action and use defaults.
If no date is provided, use ${todayDate}.
All required fields must exist and be non-null.
No extra fields are allowed.

TIME FORMAT:
- h:mma (9:00am)
DATE FORMAT:
- YYYY-MM-DD
DURATION:
- Integer minutes between start and end.

DEFAULTS:
Break → 9:00am–9:30am, duration 30
Leave → fromDate = toDate = ${todayDate}
Task → scheduled = ${todayDate}
Meeting → 10:00am–11:00am

Break:
{
 "action":"createBreak",
 "startTime":"9:00am",
 "endTime":"9:30am",
 "type":"Short Break",
 "createdDate":"YYYY-MM-DD",
 "duration":30
}

Leave:
{
 "action":"createLeave",
 "fromDate":"YYYY-MM-DD",
 "toDate":"YYYY-MM-DD",
 "reason":"Personal leave"
}

Task:
{
 "action":"createTask",
 "title":"Sample task",
 "description":"Placeholder",
 "priority":"Normal",
 "status":"To Do",
 "scheduled":"YYYY-MM-DD"
}

Meeting:
{
 "action":"createMeeting",
 "description":"Team Sync",
 "from":"10:00am",
 "to":"11:00am",
 "scheduleDate":"YYYY-MM-DD"
}
`;
