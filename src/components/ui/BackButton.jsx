export default function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed cursor-pointer left-1/2 top-48 z-50 -translate-x-1/2 h-10 w-10 rounded-full bg-red-500 text-black shadow-lg shadow-black/20 transition-colors hover:bg-red-600"
      aria-label="Reset camera"
    >
      x
    </button>
  );
}
