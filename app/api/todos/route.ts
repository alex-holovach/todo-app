import { type NextRequest, NextResponse } from "next/server"
import { flushLogs } from "@/lib/otel-logger"

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

// In-memory storage for todos
let todos: Todo[] = []
let nextId = 1

// GET /api/todos - Get all todos
export async function GET() {
  console.log('API: Getting todos, count:', todos.length)
  await flushLogs()
  return NextResponse.json(todos)
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
      id: nextId++,
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    todos.push(newTodo)

    await flushLogs()
    return NextResponse.json(newTodo, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}

// DELETE /api/todos - Clear all todos (optional)
export async function DELETE() {
  todos = []
  nextId = 1
  return NextResponse.json({ message: "All todos cleared" })
}
