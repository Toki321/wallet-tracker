// utils/validators.ts

export function isValidETHAmount(amount: string): boolean {
    // Ensure there's only one dot
    if ((amount.match(/\./g) || []).length > 1) {
        return false;
    }

    // Ensure it doesn't start with a dot
    if (amount.startsWith('.')) {
        return false;
    }

    // Ensure it's a valid number
    if (isNaN(Number(amount))) {
        return false;
    }

    return true;
}
