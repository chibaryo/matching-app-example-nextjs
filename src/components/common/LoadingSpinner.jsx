const LoadingSpinner = (props) => {
  return (
    <div className="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
      <div className="flex justify-center items-center mt-[40vh]">
        <div className="relative">
          <div className="w-80 h-80 border-emerald-200 border-4 rounded-full">
          </div>
          <div className="w-80 h-80 border-emerald-700 border-t-4 animate-spin rounded-full absolute left-0 top-0">
          </div>
          <span className='absolute whitespace-nowrap inline-block text-amber-600 text-2xl font-bold top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2'>
            {props.message}
          </span>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner