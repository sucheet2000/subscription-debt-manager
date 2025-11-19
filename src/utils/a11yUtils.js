/**
 * Accessibility Utilities
 * Provides helpers for ARIA labels, semantic structure, and inclusive interactions
 */

/**
 * Generate unique ID for form fields
 * @param {string} prefix - Prefix for the ID
 * @param {number} index - Optional index
 * @returns {string} Unique ID
 */
export const generateId = (prefix, index = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${index || random}-${timestamp}`;
};

/**
 * Get ARIA attributes for form field
 * @param {string} fieldName - Name of the field
 * @param {string} error - Error message if present
 * @param {string} description - Field description
 * @returns {Object} ARIA attributes
 */
export const getFormFieldA11y = (fieldName, error = null, description = null) => {
  const attributes = {};

  if (error) {
    attributes['aria-invalid'] = 'true';
    attributes['aria-describedby'] = `${fieldName}-error`;
  }

  if (description && !error) {
    attributes['aria-describedby'] = `${fieldName}-description`;
  }

  return attributes;
};

/**
 * Get ARIA attributes for buttons
 * @param {string} label - Button label/text
 * @param {boolean} disabled - Is button disabled
 * @param {string} ariaLabel - Custom aria-label
 * @returns {Object} ARIA attributes
 */
export const getButtonA11y = (label, disabled = false, ariaLabel = null) => {
  return {
    'aria-label': ariaLabel || label,
    disabled: disabled,
    ...(disabled && { 'aria-disabled': 'true' }),
  };
};

/**
 * Get ARIA attributes for icon buttons
 * @param {string} iconName - Name of the icon
 * @param {string} action - What the button does
 * @returns {Object} ARIA attributes with accessible label
 */
export const getIconButtonA11y = (iconName, action) => {
  const labelMap = {
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    restore: 'Restore',
    close: 'Close',
    add: 'Add',
    save: 'Save',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    menu: 'Menu',
    download: 'Download',
    settings: 'Settings',
  };

  const label = labelMap[action] || action;
  return {
    'aria-label': `${label}`,
    type: 'button',
  };
};

/**
 * Get ARIA attributes for modal dialog
 * @param {string} title - Modal title
 * @param {string} modalId - Unique ID for modal
 * @returns {Object} ARIA attributes
 */
export const getModalA11y = (title, modalId) => {
  return {
    'role': 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': `${modalId}-title`,
    'aria-describedby': `${modalId}-description`,
  };
};

/**
 * Get ARIA attributes for alert/toast
 * @param {string} type - Type of alert (error, warning, info, success)
 * @returns {Object} ARIA attributes
 */
export const getAlertA11y = (type = 'info') => {
  const roleMap = {
    error: 'alert',
    warning: 'status',
    info: 'status',
    success: 'status',
  };

  return {
    'role': roleMap[type] || 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true',
  };
};

/**
 * Get ARIA attributes for table header
 * @param {string} sortKey - Current sort key
 * @param {string} columnKey - Column being rendered
 * @param {string} direction - Sort direction (asc, desc)
 * @returns {Object} ARIA attributes for column header
 */
export const getTableHeaderA11y = (sortKey, columnKey, direction = null) => {
  const attributes = {
    role: 'columnheader',
  };

  if (sortKey === columnKey) {
    attributes['aria-sort'] = direction === 'desc' ? 'descending' : 'ascending';
  } else {
    attributes['aria-sort'] = 'none';
  }

  return attributes;
};

/**
 * Get ARIA attributes for status indicator
 * @param {boolean} isLoading - Is loading
 * @param {boolean} isError - Is error
 * @param {string} message - Status message
 * @returns {Object} ARIA attributes
 */
export const getStatusA11y = (isLoading = false, isError = false, message = '') => {
  return {
    'aria-busy': isLoading,
    'aria-atomic': 'true',
    'aria-live': isError ? 'assertive' : 'polite',
    ...(message && { 'aria-label': message }),
  };
};

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} type - Type (polite, assertive)
 */
export const announceToScreenReader = (message, type = 'polite') => {
  const announcer = document.getElementById('sr-announcer') || createAnnouncer();

  announcer.setAttribute('aria-live', type);
  announcer.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
};

/**
 * Create screen reader announcer element
 * @returns {HTMLElement} Announcer element
 */
const createAnnouncer = () => {
  const announcer = document.createElement('div');
  announcer.id = 'sr-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');

  // Add CSS for sr-only if not already present
  if (!document.getElementById('sr-only-styles')) {
    const style = document.createElement('style');
    style.id = 'sr-only-styles';
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(announcer);
  return announcer;
};

/**
 * Focus trap manager for modals
 */
export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.previousActiveElement = null;
  }

  activate() {
    this.previousActiveElement = document.activeElement;

    // Get all focusable elements
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ];

    this.focusableElements = this.element.querySelectorAll(
      focusableSelectors.join(',')
    );

    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Add keydown listener
    this.keydownListener = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.keydownListener);
  }

  deactivate() {
    document.removeEventListener('keydown', this.keydownListener);

    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }

  handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    const firstFocusable = this.focusableElements[0];
    const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }
}

/**
 * Keyboard navigation helper
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} handlers - Object with handlers for keys
 */
export const handleKeyboardNavigation = (event, handlers = {}) => {
  const keyHandlers = {
    Enter: handlers.enter,
    Escape: handlers.escape,
    ArrowUp: handlers.arrowUp,
    ArrowDown: handlers.arrowDown,
    ArrowLeft: handlers.arrowLeft,
    ArrowRight: handlers.arrowRight,
    ' ': handlers.space,
    ...handlers,
  };

  if (keyHandlers[event.key]) {
    keyHandlers[event.key](event);
  }
};

/**
 * Skip to main content link generator
 * @returns {React.ReactElement} Skip link component
 */
export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-2"
    >
      Skip to main content
    </a>
  );
};

/**
 * Semantic HTML structure helpers
 */
export const semanticElements = {
  // Main content wrapper
  main: (children, id = 'main-content') => ({
    element: 'main',
    props: { id },
    children,
  }),

  // Article wrapper
  article: (children, props = {}) => ({
    element: 'article',
    props,
    children,
  }),

  // Section with heading
  section: (heading, children, props = {}) => ({
    element: 'section',
    props,
    children: [
      { element: 'h2', children: heading },
      ...children,
    ],
  }),

  // Navigation
  nav: (children, label = '') => ({
    element: 'nav',
    props: { 'aria-label': label },
    children,
  }),

  // Footer
  footer: (children, props = {}) => ({
    element: 'footer',
    props,
    children,
  }),
};

/**
 * Check if element is visible to screen readers
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Is visible to screen readers
 */
export const isAccessible = (element) => {
  if (!element) return false;

  // Check if element is hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  // Check if parent is hidden
  if (element.parentElement) {
    return isAccessible(element.parentElement);
  }

  return true;
};

/**
 * Get accessible name of element
 * @param {HTMLElement} element - Element to get name from
 * @returns {string} Accessible name
 */
export const getAccessibleName = (element) => {
  // Check aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }

  // Check aria-labelledby
  const labelledById = element.getAttribute('aria-labelledby');
  if (labelledById) {
    const labelElement = document.getElementById(labelledById);
    if (labelElement) {
      return labelElement.textContent;
    }
  }

  // Check associated label for form elements
  if (element.id && element.tagName === 'INPUT') {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent;
    }
  }

  // Fall back to text content
  return element.textContent || element.value || '';
};

export default {
  generateId,
  getFormFieldA11y,
  getButtonA11y,
  getIconButtonA11y,
  getModalA11y,
  getAlertA11y,
  getTableHeaderA11y,
  getStatusA11y,
  announceToScreenReader,
  FocusTrap,
  handleKeyboardNavigation,
  SkipLink,
  semanticElements,
  isAccessible,
  getAccessibleName,
};
