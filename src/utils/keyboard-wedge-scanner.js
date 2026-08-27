export const E81W_SCANNER_PROFILE = Object.freeze({
    terminator: 'Enter',
    maximumInterKeyDelayMs: 30,
    minimumValueLength: 3
});

const isTextEntry = target => target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target?.isContentEditable;

const captureTextEntry = target => {
    if (!isTextEntry(target)) return null;

    if (target.isContentEditable) {
        return {
            target,
            textContent: target.textContent,
            type: 'contenteditable'
        };
    }

    return {
        target,
        value: target.value,
        selectionStart: target.selectionStart,
        selectionEnd: target.selectionEnd,
        selectionDirection: target.selectionDirection,
        type: 'value'
    };
};

const getNativeValueSetter = target => {
    const prototype = target instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    return Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
};

const restoreTextEntry = snapshot => {
    if (!snapshot?.target?.isConnected) return;

    const { target } = snapshot;
    if (snapshot.type === 'contenteditable') {
        target.textContent = snapshot.textContent;
    } else {
        const valueSetter = getNativeValueSetter(target);
        valueSetter?.call(target, snapshot.value);
    }

    target.dispatchEvent(new Event('input', { bubbles: true }));

    if (snapshot.type === 'value' && snapshot.selectionStart !== null) {
        target.setSelectionRange(
            snapshot.selectionStart,
            snapshot.selectionEnd,
            snapshot.selectionDirection || undefined
        );
    }
};

export const createKeyboardWedgeScanner = ({
    onScan,
    profile = E81W_SCANNER_PROFILE
}) => {
    let buffer = '';
    let lastKeyAt = null;
    let target = null;
    let textEntrySnapshot = null;

    const reset = () => {
        buffer = '';
        lastKeyAt = null;
        target = null;
        textEntrySnapshot = null;
    };

    const start = event => {
        buffer = event.key;
        lastKeyAt = event.timeStamp;
        target = event.target;
        textEntrySnapshot = captureTextEntry(event.target);
    };

    const handleKeyDown = event => {
        if (event.defaultPrevented || event.isComposing || event.repeat
            || event.ctrlKey || event.altKey || event.metaKey) {
            reset();
            return;
        }

        const withinDeviceTiming = lastKeyAt !== null
            && event.timeStamp >= lastKeyAt
            && event.timeStamp - lastKeyAt <= profile.maximumInterKeyDelayMs;

        if (event.key === profile.terminator) {
            const isScan = withinDeviceTiming && buffer.length >= profile.minimumValueLength;
            const value = buffer;
            const snapshot = textEntrySnapshot;
            reset();

            if (!isScan) return;

            event.preventDefault();
            event.stopPropagation();
            restoreTextEntry(snapshot);
            onScan(value);
            return;
        }

        if (event.key.length !== 1) {
            reset();
            return;
        }

        if (!withinDeviceTiming || event.target !== target) {
            start(event);
            return;
        }

        buffer += event.key;
        lastKeyAt = event.timeStamp;
    };

    return { handleKeyDown, reset };
};
