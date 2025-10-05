export default function Error({ error }) {
    return (
        <div className='py-2 px-4 my-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400' role='alert'>
            <span className='font-medium'>Error:</span> {error}
        </div>
    );
};