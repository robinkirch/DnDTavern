import React from "react";

export function useForceUpdate(): () => void {
    const [count, setCount] = React.useState(0);
    const forceUpdate = React.useCallback(()=> {
        setCount(c => c+1);
    }, []);

    return forceUpdate;
}