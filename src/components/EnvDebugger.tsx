export const EnvDebugger = () => {
  const envVars = Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      let value = import.meta.env[key]
      // Mask sensitive values
      if (key.includes('KEY') || key.includes('SECRET')) {
        value = value ? `${value.substring(0, 15)}...` : 'undefined'
      }
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-64">
      <h3 className="text-white font-bold mb-2">🔧 Environment Debug Information</h3>
      <div className="space-y-1">
        <div><span className="text-yellow-400">Mode:</span> {import.meta.env.MODE}</div>
        <div><span className="text-yellow-400">Dev:</span> {import.meta.env.DEV ? 'true' : 'false'}</div>
        <div><span className="text-yellow-400">Prod:</span> {import.meta.env.PROD ? 'true' : 'false'}</div>
        <div><span className="text-yellow-400">Base URL:</span> {import.meta.env.BASE_URL}</div>
        <hr className="border-gray-700 my-2" />
        <div className="text-white font-semibold">Environment Variables:</div>
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key}>
            <span className="text-blue-400">{key}:</span>{' '}
            <span className={value === 'undefined' ? 'text-red-400' : 'text-green-400'}>
              {value || 'undefined'}
            </span>
          </div>
        ))}
        {Object.keys(envVars).length === 0 && (
          <div className="text-red-400">No VITE_ environment variables found!</div>
        )}
      </div>
    </div>
  )
}
