// src/lib/pdf/binary.ts

/**
 * Normalize various binary-like inputs (ArrayBuffer, SharedArrayBuffer, Uint8Array, Node Buffer)
 * to a Uint8Array that works in Web and Node runtimes.
 */
export function toUint8(
  input: ArrayBuffer | SharedArrayBuffer | Uint8Array | Buffer
): Uint8Array {
  // Already a Uint8Array
  if (input instanceof Uint8Array) return input;

  // Node Buffer (avoid importing 'buffer' types directly)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeBuf = input as any;
  if (typeof maybeBuf?.subarray === "function" && typeof maybeBuf?.byteLength === "number" && maybeBuf?.buffer) {
    // Node Buffer behaves like Uint8Array; ensure we return a fresh Uint8Array
    return new Uint8Array(maybeBuf.buffer, maybeBuf.byteOffset ?? 0, maybeBuf.byteLength);
  }

  // ArrayBuffer or SharedArrayBuffer
  if (input instanceof ArrayBuffer || isSharedArrayBuffer(input)) {
    return new Uint8Array(input as ArrayBuffer);
  }

  // Fallback – copy via typed array constructor (covers odd polyfills)
  return new Uint8Array(input as ArrayBuffer);
}

function isSharedArrayBuffer(x: unknown): x is SharedArrayBuffer {
  // Narrow in environments that support SharedArrayBuffer
  return typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer;
}
