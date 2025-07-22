export const lightColors = {
    primary: '#7C3AED', // Vibrant purple for interactive elements
    background: '#F9FAFB', // Light gray for the background
    card: '#FFFFFF', // Pure white for card backgrounds
    text: '#111827', // Near black for primary text
    textSecondary: '#6B7280', // Medium gray for secondary text
    border: '#E5E7EB',
    notification: '#EF4444', // Red for notifications
    white: '#FFFFFF',
    black: '#000000',
    darkGray: '#4B5563',
    mediumGray: '#D1D5DB',
    success: '#10B981', // Green for success states
    warning: '#F59E0B', // Amber for warning states
    info: '#3B82F6', // Blue for info states
    purple: {
        50: '#F5F3FF',
        100: '#EDE9FE',
        500: '#8B5CF6',
        600: '#7C3AED',
        700: '#6D28D9',
    },
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    }
};

export const darkColors = {
    primary: '#7C3AED', // Keep the same purple for consistency
    background: '#111827', // Dark background
    card: '#1F2937', // Slightly lighter for cards
    text: '#F9FAFB', // Near white for primary text
    textSecondary: '#9CA3AF', // Light gray for secondary text
    border: '#374151',
    notification: '#EF4444', // Keep the same red for notifications
    white: '#FFFFFF',
    black: '#000000',
    darkGray: '#6B7280',
    mediumGray: '#4B5563',
    success: '#059669', // Darker green for dark mode
    warning: '#D97706', // Darker amber for dark mode
    info: '#2563EB', // Darker blue for dark mode
    purple: {
        50: '#2D1B69',
        100: '#3B2477',
        500: '#7C3AED',
        600: '#6D28D9',
        700: '#5B21B6',
    },
    gray: {
        50: '#374151',
        100: '#1F2937',
        200: '#374151',
        300: '#4B5563',
        400: '#6B7280',
        500: '#9CA3AF',
        600: '#D1D5DB',
        700: '#E5E7EB',
        800: '#F3F4F6',
        900: '#F9FAFB',
    }
};

// Default export for initial load, can be updated by theme context
export const colors = lightColors; 