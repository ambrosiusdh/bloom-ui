const debounceIds = {}
function debounce(func, debounceKey, delay = 500) {
    clearTimeout(debounceIds[debounceKey])
    debounceIds[debounceKey] = setTimeout(func, delay)
}

function clearDebounce (debounceKey) {
    clearTimeout(debounceIds[debounceKey])
    delete debounceIds[debounceKey]
}

export {
    debounce,
    clearDebounce
}