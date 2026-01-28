/**
 * Workflow API Routes
 * Handles CRUD operations for media workflows
 */

import { sessionDb } from "../database";

/**
 * Handle workflow-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleWorkflowRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {

  // GET /api/workflows - List all workflows
  if (url.pathname === '/api/workflows' && req.method === 'GET') {
    const workflows = sessionDb.getWorkflows();

    // Return simplified list (without full node/edge data)
    const workflowList = workflows.map(w => ({
      id: w.id,
      name: w.name,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));

    return new Response(JSON.stringify(workflowList), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/workflows - Create new workflow
  if (url.pathname === '/api/workflows' && req.method === 'POST') {
    try {
      const body = await req.json() as {
        name?: string;
        nodes?: unknown[];
        edges?: unknown[];
      };

      const workflow = sessionDb.createWorkflow(
        body.name || 'Untitled Workflow',
        body.nodes || [],
        body.edges || []
      );

      return new Response(JSON.stringify({
        id: workflow.id,
        name: workflow.name,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/workflows/:id - Get workflow by ID
  if (url.pathname.match(/^\/api\/workflows\/[^/]+$/) && req.method === 'GET') {
    const workflowId = url.pathname.split('/').pop()!;
    const workflow = sessionDb.getWorkflow(workflowId);

    if (!workflow) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      id: workflow.id,
      name: workflow.name,
      nodes: JSON.parse(workflow.nodes),
      edges: JSON.parse(workflow.edges),
      createdAt: workflow.created_at,
      updatedAt: workflow.updated_at,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT /api/workflows/:id - Update workflow
  if (url.pathname.match(/^\/api\/workflows\/[^/]+$/) && req.method === 'PUT') {
    const workflowId = url.pathname.split('/').pop()!;

    try {
      const body = await req.json() as {
        name?: string;
        nodes?: unknown[];
        edges?: unknown[];
      };

      const success = sessionDb.updateWorkflow(workflowId, body);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Workflow not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const workflow = sessionDb.getWorkflow(workflowId);
      return new Response(JSON.stringify({
        id: workflow!.id,
        name: workflow!.name,
        nodes: JSON.parse(workflow!.nodes),
        edges: JSON.parse(workflow!.edges),
        createdAt: workflow!.created_at,
        updatedAt: workflow!.updated_at,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/workflows/:id - Delete workflow
  if (url.pathname.match(/^\/api\/workflows\/[^/]+$/) && req.method === 'DELETE') {
    const workflowId = url.pathname.split('/').pop()!;
    const success = sessionDb.deleteWorkflow(workflowId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Route not handled by this module
  return undefined;
}
