import { type NextRequest, NextResponse } from "next/server"

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

// In-memory storage for todos (shared with main route)
// Note: In a real app, this would be in a separate module or database
declare global {
  var todos: Todo[] | undefined
  var nextId: number | undefined
}

// Initialize if not exists
if (!global.todos) {
  global.todos = []
  global.nextId = 1
}

// GET /api/todos/[id] - Get a specific todo
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('Log from GET')
  const id = await Number.parseInt(params.id)

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 })
  }

  const todo = global.todos!.find((t) => t.id === id)

  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 })
  }

  return NextResponse.json(todo)
}

// PATCH /api/todos/[id] - Toggle todo completion
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  const idNum = Number.parseInt(id)

  if (isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 })
  }

  const todoIndex = global.todos!.findIndex((t) => t.id === idNum)

  if (todoIndex === -1) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 })
  }

  // Toggle completion status
  global.todos![todoIndex].completed = !global.todos![todoIndex].completed

  return NextResponse.json(global.todos![todoIndex])
}

// DELETE /api/todos/[id] - Delete a specific todo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  const idNum = Number.parseInt(id)

  if (isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 })
  }

  const todoIndex = global.todos!.findIndex((t) => t.id === idNum)

  if (todoIndex === -1) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 })
  }

  const deletedTodo = global.todos!.splice(todoIndex, 1)[0]

  return NextResponse.json({
    message: "Todo deleted successfully",
    deletedTodo,
  })
}
