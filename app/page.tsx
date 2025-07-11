import TodoApp from "@/components/todo-app"
import { flushLogs } from "@/lib/otel-logger"

export default async function Page() {
  console.log('Log from page')

  // Flush logs immediately in server component
  await flushLogs()

  return <TodoApp />
}
