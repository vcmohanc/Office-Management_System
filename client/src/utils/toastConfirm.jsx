import toast from 'react-hot-toast';

export const toastConfirm = (message) => {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 min-w-[250px]">
          <p className="text-sm font-medium text-gray-800">{message}</p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-1.5 text-sm font-medium text-white bg-[#162D50] rounded-md hover:bg-[#0f1f38] transition-colors shadow-sm"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
      }
    );
  });
};
