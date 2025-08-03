const debounceIds = {}
function debounce(func, debounceKey, delay = 500) {
    clearTimeout(debounceIds[debounceKey])
    debounceIds[debounceKey] = setTimeout(func, delay)
}

export {
    debounce
}