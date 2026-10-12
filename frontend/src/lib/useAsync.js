import { useState, useEffect, useCallback, useRef } from 'react'

export function useAsync(loader, deps = []) {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const counter = useRef(0)

    const run = useCallback(() => {
        const id = ++counter.current
        setLoading(true)
        setError(null)
        loader().then(
            (res) => { if (id === counter.current) { setData(res); setLoading(false) } },
            (err) => { if (id === counter.current) { setError(err); setLoading(false) } }
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    useEffect(() => { run() }, [run])

    return { data, error, loading, reload: run }
}