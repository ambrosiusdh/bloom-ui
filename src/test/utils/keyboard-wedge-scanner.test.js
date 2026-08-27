import { describe, expect, it, vi } from 'vitest';

import { createKeyboardWedgeScanner } from '@utils/keyboard-wedge-scanner.js';

const scannerEvent = (target, key, timeStamp) => ({
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    isComposing: false,
    key,
    metaKey: false,
    preventDefault: vi.fn(),
    repeat: false,
    stopPropagation: vi.fn(),
    target,
    timeStamp
});

describe('keyboard wedge scanner text restoration', () => {
    it('uses the native textarea setter through an intermediate prototype', () => {
        const onScan = vi.fn();
        const scanner = createKeyboardWedgeScanner({ onScan });
        const textarea = document.createElement('textarea');
        const intermediatePrototype = Object.create(HTMLTextAreaElement.prototype);
        Object.setPrototypeOf(textarea, intermediatePrototype);
        textarea.value = 'manual note';
        textarea.setSelectionRange(6, 6);
        document.body.append(textarea);

        let timeStamp = 1_000;
        for (const character of '1234') {
            scanner.handleKeyDown(scannerEvent(textarea, character, timeStamp));
            textarea.value += character;
            timeStamp += 1;
        }
        scanner.handleKeyDown(scannerEvent(textarea, 'Enter', timeStamp));

        expect(onScan).toHaveBeenCalledWith('1234');
        expect(textarea).toHaveValue('manual note');
        expect(textarea.selectionStart).toBe(6);
        expect(textarea.selectionEnd).toBe(6);
        textarea.remove();
    });
});
