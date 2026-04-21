'use client'

interface BigButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
  fullWidth?: boolean
  size?: 'large' | 'xlarge'
}

export default function BigButton({ 
  onClick, 
  children, 
  variant = 'primary', 
  disabled = false,
  fullWidth = true,
  size = 'large'
}: BigButtonProps) {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  }

  const sizes = {
    large: 'p-5 text-xl',
    xlarge: 'p-6 text-2xl'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : 'px-8'}
        rounded-xl font-bold shadow-lg
        transition-all active:scale-95
        disabled:opacity-50 disabled:active:scale-100
        min-h-[56px]
      `}
    >
      {children}
    </button>
  )
}
