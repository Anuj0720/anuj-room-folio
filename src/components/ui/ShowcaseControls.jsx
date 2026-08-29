import { Play, Square, X } from "lucide-react";
import { SHOWCASE_TARGET_BY_ID } from "../r3f/showcaseTargets";

function PositionStyle({ top, left }) {
  const leftValue = typeof left === "number" ? `${left}px` : left;
  return {
    top: `${top * 0.25}rem`,
    left: leftValue,
    transform: "translate(-50%, -50%)",
  };
}

function ActionButton({ position, onClick, disabled, children, label, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={PositionStyle(position)}
      className={`fixed z-[100] cursor-pointer flex h-10 w-10 items-center justify-center rounded-full shadow-lg shadow-black/20 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}


export default function ShowcaseControls({
  selectedId,
  isDissolving,
  onStart,
  onStop,
  onBack,
}) {
  const target = selectedId ? SHOWCASE_TARGET_BY_ID[selectedId] : null;
  if (!target) return null;

  return (
    <>
      <ActionButton
        position={target.buttons.play}
        onClick={onStart}
        disabled={isDissolving}
        label={`Play ${target.label} dissolve effect`}
        className="bg-emerald-500 text-black hover:bg-emerald-600"
      >
        <Play size={18} fill="currentColor" />
      </ActionButton>

      <ActionButton
        position={target.buttons.stop}
        onClick={onStop}
        disabled={!isDissolving}
        label={`Stop ${target.label} dissolve effect`}
        className="bg-red-500 text-black hover:bg-red-600"
      >
        <Square size={16} fill="currentColor" />
      </ActionButton>

      <ActionButton
        position={target.buttons.back}
        onClick={onBack}
        label={`Back from ${target.label}`}
        className="bg-red-500 text-black hover:bg-red-600"
      >
        <X size={18} />
      </ActionButton>
    </>
  );
}
