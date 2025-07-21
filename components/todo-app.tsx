"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: string
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/todos")
      if (response.ok) {
        const data = await response.json()
        setTodos(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch todos",
        variant: "destructive",
      })
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newTodo.trim() }),
      })

      if (response.ok) {
        const newTodoItem = await response.json()
        setTodos((prev) => [...prev, newTodoItem])
        setNewTodo("")
        toast({
          title: "Success",
          description: "Todo added successfully",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to add todo (${response.status})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add todo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos((prev) => prev.map((todo) => (todo.id === id ? updatedTodo : todo)))
        toast({
          title: "Success",
          description: `Todo marked as ${updatedTodo.completed ? "completed" : "incomplete"}`,
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to update todo (${response.status})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update todo",
        variant: "destructive",
      })
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id))
        toast({
          title: "Success",
          description: "Todo deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to delete todo (${response.status})`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete todo",
        variant: "destructive",
      })
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Todo App</CardTitle>
            <p className="text-center text-muted-foreground">
              {completedCount} of {totalCount} tasks completed
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add new todo */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTodo()
                  }
                }}
                disabled={loading}
              />
              <Button onClick={addTodo} disabled={loading || !newTodo.trim()} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Todo list */}
            <div className="space-y-2">
              {todos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No todos yet. Add one above to get started!
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                    <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                      {todo.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(todo.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            {todos.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total: {totalCount}</span>
                  <span>Completed: {completedCount}</span>
                  <span>Remaining: {totalCount - completedCount}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
