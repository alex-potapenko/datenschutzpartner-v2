/**
 * Horizontal rule that breaks out of the bordered content column and spans the full viewport width.
 */
export function FullBleedDivider() {
  return (
    <div
      aria-hidden
      className="border-border relative left-1/2 w-screen -translate-x-1/2 border-b"
    />
  );
}
