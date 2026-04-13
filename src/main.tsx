import { render } from 'ink'
import { createRuntime } from './infrastructure/bootstrap/createRuntime'
import { App } from './presentation/ink/App'

async function main() {
  const runtime = await createRuntime()
  render(<App runtime={runtime} cwd={process.cwd()} />)
}

void main()
