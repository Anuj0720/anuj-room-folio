export default function BackButton({ onClick, top = 48, left = "50%" }) {
  const leftValue = typeof left === "number" ? `${left}px` : left;
  const transform = leftValue === "50%" ? "translateX(-50%)" : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ top: `${top * 0.25}rem`, left: leftValue, transform }}
      className="fixed cursor-pointer z-100 h-10 w-10 rounded-full bg-red-500 text-black shadow-lg shadow-black/20 transition-colors hover:bg-red-600"
      aria-label="Reset camera"
    >
      x
    </button>
  );
}
