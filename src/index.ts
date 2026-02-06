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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
