import TodoApp from "@/components/todo-app"

export default async function Page() {
  console.log('Log from page')
  console.error('Error from page')
  console.warn('Warn from page')
  console.debug('Debug from page')
  console.log('Log with attributes', {
    hello: 'world',
  })

  return <TodoApp />
}
