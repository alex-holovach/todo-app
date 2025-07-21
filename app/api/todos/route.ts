import { type NextRequest, NextResponse } from "next/server"

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

// In-memory storage for todos (shared with [id] route)
declare global {
  var todos: Todo[] | undefined
  var nextId: number | undefined
}

// Initialize if not exists
if (!global.todos) {
  global.todos = []
  global.nextId = 1
}

// GET /api/todos - Get all todos
export async function GET() {
  console.log('API: Getting todos, count:', global.todos!.length)
  return NextResponse.json(global.todos!)
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    console.log('API: Creating todo with text:', text)

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required and must be a non-empty string" }, { status: 400 })
    }

    const newTodo: Todo = {
      id: global.nextId!++,
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    global.todos!.push(newTodo)

    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}

// DELETE /api/todos - Clear all todos (optional)
export async function DELETE() {
  global.todos = []
  global.nextId = 1
  return NextResponse.json({ message: "All todos cleared" })
}
