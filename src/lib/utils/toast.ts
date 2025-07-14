export interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function showToast(message: string, options: ToastOptions = {}) {
  const {
    type = 'info',
    duration = 3000,
    position = 'top-right'
  } = options;

  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = `fixed z-50 p-4 space-y-2 ${getPositionClasses(position)}`;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `
    max-w-sm px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out
    ${getTypeClasses(type)}
    animate-slide-in
  `;
  
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-sm font-medium">${getIcon(type)}</span>
      <span class="text-sm">${message}</span>
      <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;

  // Add toast to container
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);

  return toast;
}

function getPositionClasses(position: string): string {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    default:
      return 'top-4 right-4';
  }
}

function getTypeClasses(type: string): string {
  switch (type) {
    case 'success':
      return 'bg-green-50 border border-green-200 text-green-800';
    case 'error':
      return 'bg-red-50 border border-red-200 text-red-800';
    case 'warning':
      return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
    case 'info':
    default:
      return 'bg-blue-50 border border-blue-200 text-blue-800';
  }
}

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
    default:
      return 'ℹ️';
  }
}
