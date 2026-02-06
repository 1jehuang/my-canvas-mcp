import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CanvasAPI } from "./canvas-api.js";

const api = new CanvasAPI();
const server = new McpServer({
  name: "canvas",
  version: "1.0.0",
});

// 1. Get my profile
server.tool("get_my_profile", "Get your own Canvas user profile information", {}, async () => {
  const data = await api.get("/users/self/profile");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

// 2. Get my courses
server.tool(
  "get_my_courses",
  "Get all courses you are enrolled in",
  {},
  async () => {
    const data = await api.getPaginated("/courses", {
      enrollment_state: "active",
      include: ["term", "total_scores"],
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 3. Get course assignments
server.tool(
  "get_course_assignments",
  "Get all assignments for a specific course",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated(`/courses/${course_id}/assignments`, {
      order_by: "due_at",
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 4. Get assignment details
server.tool(
  "get_assignment_details",
  "Get detailed information about a specific assignment",
  {
    course_id: z.number().describe("The Canvas course ID"),
    assignment_id: z.number().describe("The assignment ID"),
  },
  async ({ course_id, assignment_id }) => {
    const data = await api.get(
      `/courses/${course_id}/assignments/${assignment_id}`
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 5. Get my submissions for a course
server.tool(
  "get_my_submissions",
  "Get your own submissions for all assignments in a course",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated(
      `/courses/${course_id}/students/submissions`,
      {
        "student_ids[]": "self",
        include: ["assignment", "submission_comments"],
      }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 6. Get my submission for a specific assignment
server.tool(
  "get_my_submission",
  "Get your own submission for a specific assignment",
  {
    course_id: z.number().describe("The Canvas course ID"),
    assignment_id: z.number().describe("The assignment ID"),
  },
  async ({ course_id, assignment_id }) => {
    const data = await api.get(
      `/courses/${course_id}/assignments/${assignment_id}/submissions/self`,
      { include: ["submission_comments"] }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 7. Get my upcoming assignments
server.tool(
  "get_my_upcoming_assignments",
  "Get your upcoming assignments and events",
  {},
  async () => {
    const data = await api.get("/users/self/upcoming_events");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 8. Get my todos
server.tool(
  "get_my_todos",
  "Get your Canvas todo items",
  {},
  async () => {
    const data = await api.get("/users/self/todo");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 9. Get course modules
server.tool(
  "get_course_modules",
  "Get all modules for a course",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated(`/courses/${course_id}/modules`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 10. Get module items
server.tool(
  "get_module_items",
  "Get all items in a specific module",
  {
    course_id: z.number().describe("The Canvas course ID"),
    module_id: z.number().describe("The module ID"),
  },
  async ({ course_id, module_id }) => {
    const data = await api.getPaginated(
      `/courses/${course_id}/modules/${module_id}/items`
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 11. Get course files
server.tool(
  "get_course_files",
  "Get files available in a course",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated(`/courses/${course_id}/files`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 12. Get page content
server.tool(
  "get_page",
  "Get the content of a Canvas page in a course",
  {
    course_id: z.number().describe("The Canvas course ID"),
    page_url: z
      .string()
      .describe('The page URL slug (e.g., "syllabus" or "course-overview")'),
  },
  async ({ course_id, page_url }) => {
    const data = await api.get(`/courses/${course_id}/pages/${page_url}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 13. Get announcements
server.tool(
  "get_announcements",
  "Get announcements for a course (instructor-posted)",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated("/announcements", {
      "context_codes[]": `course_${course_id}`,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 14. Submit assignment — text entry
server.tool(
  "submit_assignment_text",
  "Submit a text entry for an assignment",
  {
    course_id: z.number().describe("The Canvas course ID"),
    assignment_id: z.number().describe("The assignment ID"),
    body: z.string().describe("The text/HTML body to submit"),
  },
  async ({ course_id, assignment_id, body }) => {
    const data = await api.post(
      `/courses/${course_id}/assignments/${assignment_id}/submissions`,
      {
        submission: {
          submission_type: "online_text_entry",
          body,
        },
      }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 15. Submit assignment — URL
server.tool(
  "submit_assignment_url",
  "Submit a URL for an assignment",
  {
    course_id: z.number().describe("The Canvas course ID"),
    assignment_id: z.number().describe("The assignment ID"),
    url: z.string().describe("The URL to submit"),
  },
  async ({ course_id, assignment_id, url }) => {
    const data = await api.post(
      `/courses/${course_id}/assignments/${assignment_id}/submissions`,
      {
        submission: {
          submission_type: "online_url",
          url,
        },
      }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 16. Submit assignment — file upload
server.tool(
  "submit_assignment_file",
  "Upload and submit a file for an assignment. Provide the absolute path to the file on disk.",
  {
    course_id: z.number().describe("The Canvas course ID"),
    assignment_id: z.number().describe("The assignment ID"),
    file_path: z.string().describe("Absolute path to the file to upload"),
  },
  async ({ course_id, assignment_id, file_path }) => {
    const fileName = file_path.split("/").pop() || "file";

    // Step 1: Request upload URL
    const uploadRequest = (await api.post(
      `/courses/${course_id}/assignments/${assignment_id}/submissions/self/files`,
      { name: fileName }
    )) as { upload_url: string; upload_params: Record<string, string> };

    // Step 2: Upload the file
    const uploadResult = (await api.uploadFile(
      uploadRequest.upload_url,
      uploadRequest.upload_params,
      file_path
    )) as { id: number };

    // Step 3: Submit with the file ID
    const data = await api.post(
      `/courses/${course_id}/assignments/${assignment_id}/submissions`,
      {
        submission: {
          submission_type: "online_upload",
          file_ids: [uploadResult.id],
        },
      }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 17. List discussion topics (topic info only — no student replies)
server.tool(
  "get_discussion_topics",
  "List discussion topics for a course (topic titles and prompts, not student replies)",
  { course_id: z.number().describe("The Canvas course ID") },
  async ({ course_id }) => {
    const data = await api.getPaginated(
      `/courses/${course_id}/discussion_topics`
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 18. Post a discussion entry
server.tool(
  "post_discussion_entry",
  "Post a new entry to a discussion topic",
  {
    course_id: z.number().describe("The Canvas course ID"),
    topic_id: z.number().describe("The discussion topic ID"),
    message: z.string().describe("The message/body of your post (HTML allowed)"),
  },
  async ({ course_id, topic_id, message }) => {
    const data = await api.post(
      `/courses/${course_id}/discussion_topics/${topic_id}/entries`,
      { message }
    );
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
