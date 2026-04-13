import { render } from 'ink'
import { createRuntime } from './infrastructure/bootstrap/createRuntime'
import { App } from './presentation/ink/App'

const runtime = createRuntime()

render(<App runtime={runtime} cwd={process.cwd()} />)
